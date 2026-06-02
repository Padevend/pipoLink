import { downloadTask } from "@/shared/api/types";
import { localDb } from "@/shared/storage/local-db";
import { useEffect, useState } from "react";
import { downloadManager } from "../services/download.manager";

export function useDownloadHistory() {
    const [history, setHistory] = useState<downloadTask[]>([]);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

    const refresh = () => {
        setIsRefreshing(true)
        const data = localDb.getDownloadRepository();
        setHistory(data);
        setTimeout(()=>{
            setIsRefreshing(false)
        },500)
    };

    const clearHistory = () => {
        setHistory(
            history.filter(
                (item) => !["completed", "failed", "cancelled"].includes(item.status),
            ),
        );

        downloadManager.clearHistory();
    };
    const deleteItem = (id: string) => {
        setHistory((prev) => prev.filter((item) => item.id !== id));
        downloadManager.cancel(id);
    }

    // Rafraîchissement en temps réel
    useEffect(() => {
        refresh();
        const interval = setInterval(() => {
            const data = localDb.getDownloadRepository();
            setHistory(prev => {
                if (JSON.stringify(prev) !== JSON.stringify(data)) return data;
                return prev;
            });
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return {
        isRefreshing,
        history,
        refresh,
        clearHistory,
        deleteItem
    };
}
