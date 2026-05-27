import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { Folder, FileText, Download, Trash2 } from "lucide-react-native";
import { useCallback } from "react";

interface SubFolder {
  id: string;
  name: string;
}

interface Document {
  id: string;
  title: string;
  fileSize: number;
  createdAt: string;
  downloadCount: number;
  type: string;
  uploadedBy?: { username: string };
}

interface FolderViewProps {
  subfolders: SubFolder[];
  documents: Document[];
  isLoading?: boolean;
  onFolderPress: (folderId: string) => void;
  onDocumentPress: (documentId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getDocumentIcon = (type: string) => {
  // Retourner la couleur en fonction du type
  const colors: Record<string, string> = {
    COURS: "#3B82F6",
    EXAMEN: "#EF4444",
    TD: "#8B5CF6",
    TP: "#8B5CF6",
    RESUME: "#10B981",
    AUTRE: "#6B7280",
  };
  return colors[type] || colors.AUTRE;
};

export function FolderView({
  subfolders,
  documents,
  isLoading = false,
  onFolderPress,
  onDocumentPress,
  onLoadMore,
  hasMore = false,
}: FolderViewProps) {
  const renderFolder = useCallback(
    ({ item }: { item: SubFolder }) => (
      <TouchableOpacity
        onPress={() => onFolderPress(item.id)}
        className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100 active:bg-gray-50"
      >
        <Folder width={24} height={24} color="#3B82F6" />
        <Text className="ml-3 flex-1 text-base font-medium text-gray-900">
          {item.name}
        </Text>
        <Text className="text-xs text-gray-400">→</Text>
      </TouchableOpacity>
    ),
    [onFolderPress]
  );

  const renderDocument = useCallback(
    ({ item }: { item: Document }) => (
      <TouchableOpacity
        onPress={() => onDocumentPress(item.id)}
        className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100 active:bg-gray-50"
      >
        <FileText
          width={24}
          height={24}
          color={getDocumentIcon(item.type)}
        />
        <View className="ml-3 flex-1">
          <Text className="text-base font-medium text-gray-900 pb-1">
            {item.title}
          </Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-xs text-gray-500">
              {formatFileSize(item.fileSize)}
            </Text>
            <Text className="text-xs text-gray-500">•</Text>
            <Text className="text-xs text-gray-500">
              {formatDate(item.createdAt)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [onDocumentPress]
  );

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoading && onLoadMore) {
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore]);

  const allItems = [
    ...subfolders.map((f) => ({ type: "folder", data: f })),
    ...documents.map((d) => ({ type: "document", data: d })),
  ];

  return (
    <>
      {subfolders.length === 0 && documents.length === 0 && !isLoading ? (
        <View className="flex-1 items-center justify-center bg-gray-50 px-4">
          <FileText width={48} height={48} color="#D1D5DB" />
          <Text className="mt-4 text-center text-gray-500">
            Aucun document ou dossier trouvé
          </Text>
        </View>
      ) : (
        <FlatList
          data={allItems}
          keyExtractor={(item) => item.data.id}
          renderItem={({ item }) =>
            item.type === "folder"
              ? renderFolder({ item: item.data as SubFolder })
              : renderDocument({ item: item.data as Document })
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoading ? <ActivityIndicator className="py-4" /> : null
          }
        />
      )}
    </>
  );
}
