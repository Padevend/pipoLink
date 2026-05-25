/**
 * attachment.queue.ts
 *
 * Concurrent download queue for chat attachments.
 *
 * The queue enforces a maximum number of simultaneous downloads to prevent:
 *   - Exhausting device bandwidth across many parallel transfers
 *   - Memory pressure from multiple large DownloadResumable instances in RAM
 *   - Excessive concurrent decryptions (which are CPU-bound)
 *
 * Design:
 *   - `MAX_CONCURRENT = 2` — conservative limit. Attachments are large binary
 *     files; more than 2 simultaneous downloads degrades perceived speed.
 *   - The queue is FIFO (first-in, first-out) within each priority tier.
 *   - The queue does NOT store DownloadResumable instances — those live in the
 *     DownloadManager. The queue only decides the ORDER and CONCURRENCY of work.
 */

export type QueuedAttachmentJob = {
  /** Attachment ID */
  id: string;
  /** The async work function to execute when the slot becomes available */
  execute: () => Promise<void>;
  /** Optional priority: 'high' jumps ahead of 'normal' items (not yet used) */
  priority?: 'high' | 'normal';
};

const MAX_CONCURRENT = 2;

export class AttachmentQueue {
  private readonly _waiting: QueuedAttachmentJob[] = [];
  private _activeCount = 0;

  /**
   * Adds a job to the queue and starts processing if a slot is free.
   * If the queue is at capacity, the job waits until a running job completes.
   *
   * @param job - The attachment download job to enqueue.
   */
  enqueue(job: QueuedAttachmentJob): void {
    // High-priority jobs are inserted at the front of the waiting list,
    // ahead of any existing normal-priority items.
    if (job.priority === 'high') {
      this._waiting.unshift(job);
    } else {
      this._waiting.push(job);
    }
    this._tick();
  }

  /**
   * Removes a job from the waiting queue by attachment ID.
   * If the job is already executing, this has no effect on the in-flight
   * download — the DownloadManager must cancel it explicitly.
   */
  dequeue(attachmentId: string): void {
    const idx = this._waiting.findIndex((j) => j.id === attachmentId);
    if (idx !== -1) {
      this._waiting.splice(idx, 1);
    }
  }

  /**
   * Returns true if a job with the given ID is currently executing.
   * Used to prevent re-enqueuing an active download.
   */
  isActive(attachmentId: string): boolean {
    // Active jobs have been dequeued from _waiting and are running.
    // We track this separately via _activeIds for O(1) lookup.
    return this._activeIds.has(attachmentId);
  }

  /**
   * Returns true if a job with the given ID is waiting in the queue.
   */
  isQueued(attachmentId: string): boolean {
    return this._waiting.some((j) => j.id === attachmentId);
  }

  /** Total number of jobs currently running */
  get activeCount(): number {
    return this._activeCount;
  }

  /** Total number of jobs waiting for a slot */
  get waitingCount(): number {
    return this._waiting.length;
  }

  // ─── PRIVATE ───────────────────────────────────────────────────────────────

  /** Set of attachment IDs whose `execute()` is currently in-flight. */
  private readonly _activeIds = new Set<string>();

  /**
   * Internal scheduler. Dequeues jobs from the waiting list and starts them
   * as long as the active count is below MAX_CONCURRENT.
   * Called after every enqueue and after every job completion.
   */
  private _tick(): void {
    while (this._activeCount < MAX_CONCURRENT && this._waiting.length > 0) {
      const job = this._waiting.shift();
      if (!job) break;

      this._activeCount++;
      this._activeIds.add(job.id);

      // Run the job and always release the slot on completion or error
      job
        .execute()
        .catch(() => {
          // Errors are handled by the DownloadManager; the queue just releases the slot.
        })
        .finally(() => {
          this._activeCount--;
          this._activeIds.delete(job.id);
          // Try to start the next waiting job
          this._tick();
        });
    }
  }
}
