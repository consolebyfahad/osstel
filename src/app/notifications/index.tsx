import EmptyState from "@/components/EmptyState";
import GradientBackground from "@/components/GradientBackground";
import ScreenHeader from "@/components/ScreenHeader";
import CustomLoading from "@/components/CustomLoading";
import { getNotificationDeepLink } from "@/services/pushNotifications";
import type { NotificationItem } from "@/types/notification";
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "../../../store/api";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function NotificationCard({
  item,
  styles,
  colors,
  onPress,
}: {
  item: NotificationItem;
  styles: ReturnType<typeof createStyles>;
  colors: AppColors;
  onPress: () => void;
}) {
  const isUnread = !item.readAt;

  return (
    <Pressable
      style={[styles.card, isUnread && styles.cardUnread]}
      onPress={onPress}
    >
      <View style={styles.cardIconWrap}>
        <Ionicons
          name={isUnread ? "notifications" : "notifications-outline"}
          size={vs(18)}
          color={isUnread ? colors.primary : colors.gray200}
        />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardBody}>{item.body}</Text>
        <Text style={styles.cardTime}>{formatWhen(item.createdAt)}</Text>
      </View>
      {isUnread ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );
  const { data, isLoading, isFetching, refetch } = useGetNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] =
    useMarkAllNotificationsReadMutation();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const handleOpen = async (item: NotificationItem) => {
    if (!item.readAt) {
      await markRead(item.id).unwrap().catch(() => undefined);
    }

    const url = getNotificationDeepLink(item.data);
    if (url) {
      router.push(url as never);
    }
  };

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScreenHeader
          title="Notifications"
          showBack
          rightSlot={
            unreadCount > 0 ? (
              <Pressable
                onPress={() => markAllRead().unwrap().catch(() => undefined)}
                disabled={isMarkingAll}
                hitSlop={8}
              >
                <Text style={styles.markAllText}>Mark all read</Text>
              </Pressable>
            ) : undefined
          }
        />

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <CustomLoading size="md" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isFetching && !isLoading}
                onRefresh={refetch}
              />
            }
          >
            {notifications.length === 0 ? (
              <EmptyState
                title="No notifications yet"
                description="Rent updates, complaints, and other alerts will show up here."
                size="md"
                style={styles.emptyState}
              />
            ) : (
              notifications.map((item) => (
                <NotificationCard
                  key={item.id}
                  item={item}
                  styles={styles}
                  colors={colors}
                  onPress={() => handleOpen(item)}
                />
              ))
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </GradientBackground>
  );
}

function createStyles(
  colors: AppColors,
  fonts: typeof FONTS,
  isDark: boolean,
) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
      backgroundColor: "transparent",
    },
    markAllText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: vs(20),
      paddingBottom: vs(40),
    },
    loadingWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyState: {
      flex: 1,
      paddingTop: vs(40),
    },
    card: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: vs(12),
      backgroundColor: isDark ? colors.white100 : colors.white,
      borderRadius: vs(16),
      borderWidth: 1,
      borderColor: isDark ? colors.white200 : colors.white100,
      padding: vs(14),
      marginBottom: vs(10),
    },
    cardUnread: {
      borderColor: colors.primary200,
    },
    cardIconWrap: {
      width: vs(36),
      height: vs(36),
      borderRadius: vs(18),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? colors.white200 : colors.white100,
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: vs(4),
    },
    cardBody: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      lineHeight: vs(20),
    },
    cardTime: {
      marginTop: vs(8),
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.medium,
      color: colors.gray200,
    },
    unreadDot: {
      width: vs(8),
      height: vs(8),
      borderRadius: vs(4),
      backgroundColor: colors.primary,
      marginTop: vs(6),
    },
  });
}
