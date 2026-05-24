import { downloadTask } from "@/shared/api/types";

export class DownloadQueue {
    private waiting: downloadTask[] = [];
    private active: downloadTask[] = [];

    constructor(
        private readonly limit: number = 3,
    ) { }

    private _process() {
        while (
            this.active.length < this.limit &&
            this.waiting.length > 0
        ) {
            const task = this.waiting.shift();

            if (!task) return;

            this.active.push(task);
        }
    }

    add(task: downloadTask) {
        this.waiting.push(task);

        this._process()
    }

    next() {
        this.active.shift();
        this._process();
    }

    getActive() {
        return this.active;
    }

    getWaiting() {
        return this.waiting;
    }
}