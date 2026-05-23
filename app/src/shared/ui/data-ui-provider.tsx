import React from "react";
import { ActivityIndicator, Text } from "react-native";
import { BRAND } from "../config/brand";

export interface DataUIProviderProps<T>{
  renderItem: (rows: { item: T , index: number}) => React.ReactNode;
  data: T[];
  ItemSeparator?: () => React.ReactNode;
  ListEmptyComponent?: () => React.ReactNode;
  isLoading?: boolean;
  LoadingComponent?: () => React.ReactNode;
  isError?: boolean;
  ErrorComponent?: () => React.ReactNode;
}

export default function DataUIProvider<T>({
  renderItem,
  data,
  ItemSeparator,
  ListEmptyComponent,
  isLoading,
  LoadingComponent,
  isError,
  ErrorComponent,
}: DataUIProviderProps<T>) {
    if (isLoading) {
        return <>{LoadingComponent ? <LoadingComponent /> : <ActivityIndicator size="large" color={BRAND.primary} />}</>;
    }

    if (isError) {
        return <>{ErrorComponent ? <ErrorComponent /> : <Text>Une erreur est survenue.</Text>}</>;
    }

    if (data.length === 0) {
        return <>{ListEmptyComponent ? <ListEmptyComponent /> : <Text>Aucun résultat trouvé.</Text>}</>;
    }

    return (
        <>
            {data.map((item, index) => (
                <React.Fragment key={index}>
                    {renderItem({ item, index })}
                    {ItemSeparator && index < data.length - 1 && <ItemSeparator />}
                </React.Fragment>
            ))}
        </>
    );
}
