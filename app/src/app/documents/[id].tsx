import { useDeleteDocument } from "@/entities/document/hooks/use-delete-document";
import { useDocument } from "@/entities/document/hooks/use-document";
import { useAuth } from "@/providers";
import { libraryApi } from "@/shared/api/library";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  Download,
  HardDrive,
  Trash2,
  User,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const getDocumentTypeColor = (type: string) => {
  const colors: Record<string, { bg: string; text: string }> = {
    COURS: { bg: "#DBEAFE", text: "#1E40AF" },
    EXAMEN: { bg: "#FEE2E2", text: "#991B1B" },
    TD: { bg: "#E9D5FF", text: "#6B21A8" },
    TP: { bg: "#E9D5FF", text: "#6B21A8" },
    RESUME: { bg: "#D1FAE5", text: "#065F46" },
    AUTRE: { bg: "#F3F4F6", text: "#374151" },
  };
  return colors[type] || colors.AUTRE;
};

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
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function DocumentDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: document, isLoading/*, error*/ } = useDocument(id || "");
  const deleteDocMutation = useDeleteDocument();

  if (!id) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">Document non trouvé</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!document) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">Document non disponible</Text>
      </View>
    );
  }

  const canDelete =
    user?.id === document.uploadedBy?.id || user?.role === "admin" || user?.role === "staff";
  const typeColor = getDocumentTypeColor(document.type);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const result = await libraryApi.downloadDocument(document.id);
      if (result?.fileUrl) {
        // Ouvrir le lien dans le navigateur
        // À implémenter selon la plateforme
        Alert.alert("Téléchargement", "Lien de téléchargement généré avec succès");
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de télécharger le document");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Confirmer la suppression", "Êtes-vous sûr de vouloir supprimer ce document?", [
      {
        text: "Annuler",
        onPress: () => { },
        style: "cancel",
      },
      {
        text: "Supprimer",
        onPress: async () => {
          try {
            await deleteDocMutation.mutateAsync(document.id);
            Alert.alert("Succès", "Document supprimé avec succès");
            router.back();
          } catch (error) {
            Alert.alert("Erreur", "Impossible de supprimer le document");
          }
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={20} color="#000" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">Détails du document</Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Document Title */}
        <View className="p-4 border-b border-gray-100">
          <Text className="text-2xl font-bold text-gray-900 mb-3">
            {document.title}
          </Text>
          {document.description && (
            <Text className="text-gray-600 text-base mb-3">
              {document.description}
            </Text>
          )}
          <View className="flex-row items-center gap-2">
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: typeColor.bg }}
            >
              <Text style={{ color: typeColor.text }} className="text-xs font-semibold">
                {document.type}
              </Text>
            </View>
          </View>
        </View>

        {/* Document Info */}
        <View className="p-4 border-b border-gray-100">
          <View className="flex-row items-center mb-4 pb-4 border-b border-gray-100">
            <HardDrive width={20} height={20} color="#6B7280" />
            <Text className="ml-3 flex-1 text-gray-700">
              {formatFileSize(document.fileSize)}
            </Text>
          </View>

          <View className="flex-row items-center mb-4 pb-4 border-b border-gray-100">
            <Calendar width={20} height={20} color="#6B7280" />
            <View className="ml-3 flex-1">
              <Text className="text-xs text-gray-500 mb-1">Publié le</Text>
              <Text className="text-gray-900">
                {formatDate(document.createdAt)}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center mb-4 pb-4 border-b border-gray-100">
            <Download width={20} height={20} color="#6B7280" />
            <View className="ml-3 flex-1">
              <Text className="text-xs text-gray-500 mb-1">Téléchargements</Text>
              <Text className="text-gray-900">
                {document.downloadCount} téléchargement
                {document.downloadCount !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <User width={20} height={20} color="#6B7280" />
            <View className="ml-3 flex-1">
              <Text className="text-xs text-gray-500 mb-1">Publié par</Text>
              <Text className="text-gray-900">
                {document.uploadedBy?.username || "Utilisateur inconnu"}
              </Text>
            </View>
          </View>
        </View>

        {/* Tags */}
        {document.moderationStatus && (
          <View className="p-4 border-b border-gray-100">
            <View className="ml-3 flex-1">
              <Text className="text-xs text-gray-500 mb-1">Status</Text>
              <Text className="text-gray-900">
                {document.moderationStatus}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View className="p-4 border-t border-gray-200 gap-3">
        <TouchableOpacity
          onPress={handleDownload}
          disabled={isDownloading}
          className="bg-blue-600 rounded-lg py-4 flex-row items-center justify-center gap-2"
        >
          {isDownloading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Download width={20} height={20} color="white" />
              <Text className="text-white font-semibold text-base">
                Télécharger
              </Text>
            </>
          )}
        </TouchableOpacity>

        {!canDelete && (
          <TouchableOpacity
            onPress={handleDelete}
            disabled={deleteDocMutation.isPending}
            className="bg-red-50 border border-red-200 rounded-lg py-3 flex-row items-center justify-center gap-2"
          >
            {deleteDocMutation.isPending ? (
              <ActivityIndicator color="#EF4444" />
            ) : (
              <>
                <Trash2 width={20} height={20} color="#EF4444" />
                <Text className="text-red-600 font-semibold text-base">
                  Supprimer
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
