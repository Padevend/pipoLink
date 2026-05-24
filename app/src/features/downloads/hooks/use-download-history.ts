import { downloadTask } from "@/shared/api/types";
import { localDb } from "@/shared/storage/local-db";
import { useEffect, useState } from "react";
import { downloadManager } from "../services/download.manager";

export function useDownloadHistory() {
    const [history, setHistory] = useState<downloadTask[]>([]);

    const refresh = () => {
        const data = localDb.getDownloadRepository();
        setHistory(data);
    };

    const clearHistory = () => {
        setHistory(
            history.filter(
                (item) => !["completed", "failed", "cancelled"].includes(item.status),
            ),
        );

        downloadManager.clearHistory();
    };

    useEffect(() => {
        refresh();
    }, []);

    return {
        history,
        refresh,
        clearHistory,
    };
}
