import EmptyState from "@/components/EmptyState";
import GradientBackground from "@/components/GradientBackground";
import ScreenHeader from "@/components/ScreenHeader";
import CustomLoading from "@/components/CustomLoading";
import type { HostelDirectoryItem } from "@/types/hostelDirectory";
import { useGetDiscoverHostelsQuery } from "../../../store/api";
import {
  formatPhoneForDisplay,
  phoneToTelUri,
} from "@/utils/phone";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type DiscoverStyles = ReturnType<typeof createStyles>;

type HostelCardProps = {
  hostel: HostelDirectoryItem;
  styles: DiscoverStyles;
  colors: AppColors;
  onCall: (phone: string, label: string) => void;
};

function HostelCard({ hostel, styles, colors, onCall }: HostelCardProps) {
  const vacancyLabel =
    hostel.vacantBeds > 0
      ? `${hostel.vacantRooms} vacant room${hostel.vacantRooms === 1 ? "" : "s"} · ${hostel.vacantBeds} bed${hostel.vacantBeds === 1 ? "" : "s"}`
      : "Fully occupied";

  const ownerName = hostel.owner?.name?.trim();
  const ownerPhone = hostel.owner?.phone?.trim();
  const contactPhone = hostel.contactPhone?.trim();

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIconWrap}>
          <Ionicons name="business" size={vs(20)} color={colors.primary} />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{hostel.name}</Text>
          <Text style={styles.cardSubtitle}>
            {[hostel.city, hostel.address].filter(Boolean).join(" · ")}
          </Text>
        </View>
        <View
          style={[
            styles.vacancyBadge,
            hostel.hasVacancy ? styles.vacancyOpen : styles.vacancyFull,
          ]}
        >
          <Text
            style={[
              styles.vacancyText,
              hostel.hasVacancy ? styles.vacancyTextOpen : styles.vacancyTextFull,
            ]}
          >
            {hostel.hasVacancy ? "Vacancy" : "Full"}
          </Text>
        </View>
      </View>

      <View style={styles.detailRow}>
        <Ionicons name="bed-outline" size={vs(16)} color={colors.gray200} />
        <Text style={styles.detailText}>{vacancyLabel}</Text>
      </View>

      {ownerName ? (
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={vs(16)} color={colors.gray200} />
          <Text style={styles.detailText}>Owner: {ownerName}</Text>
        </View>
      ) : null}

      <View style={styles.phoneRow}>
        {contactPhone ? (
          <Pressable
            style={({ pressed }) => [
              styles.phoneBtn,
              pressed && styles.phoneBtnPressed,
            ]}
            onPress={() => onCall(contactPhone, hostel.name)}
          >
            <Ionicons name="call-outline" size={vs(16)} color={colors.primary} />
            <Text style={styles.phoneBtnText}>
              Hostel · {formatPhoneForDisplay(contactPhone)}
            </Text>
          </Pressable>
        ) : null}

        {ownerPhone && ownerPhone !== contactPhone ? (
          <Pressable
            style={({ pressed }) => [
              styles.phoneBtn,
              pressed && styles.phoneBtnPressed,
            ]}
            onPress={() => onCall(ownerPhone, ownerName ?? hostel.name)}
          >
            <Ionicons name="call-outline" size={vs(16)} color={colors.primary} />
            <Text style={styles.phoneBtnText}>
              Owner · {formatPhoneForDisplay(ownerPhone)}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default function DiscoverTabScreen() {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hostels, setHostels] = useState<HostelDirectoryItem[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextSearch = searchInput.trim();
      setSearch((current) => {
        if (current === nextSearch) return current;
        setPage(1);
        setHostels([]);
        return nextSearch;
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isFetching, refetch, error } =
    useGetDiscoverHostelsQuery({
      search: search || undefined,
      page,
      limit: 20,
    });

  useEffect(() => {
    if (!data?.hostels) return;

    if (page === 1) {
      setHostels(data.hostels);
      return;
    }

    setHostels((current) => {
      const existingIds = new Set(current.map((hostel) => hostel.id));
      const next = data.hostels.filter((hostel) => !existingIds.has(hostel.id));
      return next.length > 0 ? [...current, ...next] : current;
    });
  }, [data, page]);

  const totalPages = data?.pagination.pages ?? 1;
  const hasMore = page < totalPages;
  const isInitialLoading = isLoading && hostels.length === 0;
  const isEmpty = !isInitialLoading && !isFetching && hostels.length === 0;

  const handleRefresh = useCallback(async () => {
    if (page !== 1) {
      setPage(1);
      return;
    }

    const result = await refetch();
    if (result.data?.hostels) {
      setHostels(result.data.hostels);
    }
  }, [page, refetch]);

  const handleLoadMore = () => {
    if (!hasMore || isFetching) return;
    setPage((current) => current + 1);
  };

  const handleCall = async (phone: string, label: string) => {
    const telUri = phoneToTelUri(phone);
    if (!telUri) {
      Alert.alert("Invalid number", "This phone number cannot be dialed.");
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(telUri);
      if (!canOpen) {
        Alert.alert("Cannot call", "Phone calls are not supported on this device.");
        return;
      }
      await Linking.openURL(telUri);
    } catch {
      Alert.alert("Call failed", `Could not open the phone app for ${label}.`);
    }
  };

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScreenHeader title="Find a Hostel" />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            isEmpty && styles.scrollContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && page === 1 && !isLoading}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          <Text style={styles.introText}>
            Browse registered hostels, check vacancy, and contact the owner to
            ask about a room.
          </Text>

          <View style={styles.searchWrap}>
            <Ionicons
              name="search"
              size={vs(18)}
              color={colors.gray200}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, city, or address..."
              placeholderTextColor={colors.gray200}
              value={searchInput}
              onChangeText={setSearchInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchInput.length > 0 ? (
              <Pressable onPress={() => setSearchInput("")} hitSlop={8}>
                <Ionicons
                  name="close-circle"
                  size={vs(18)}
                  color={colors.gray200}
                />
              </Pressable>
            ) : null}
          </View>

          {error ? (
            <View style={styles.errorWrap}>
              <Text style={styles.errorText}>
                Could not load hostels. Pull to refresh and try again.
              </Text>
            </View>
          ) : null}

          {isInitialLoading ? (
            <View style={styles.loadingWrap}>
              <CustomLoading size="md" />
            </View>
          ) : isEmpty ? (
            <EmptyState
              icon="business-outline"
              title={search ? "No hostels found" : "No hostels listed yet"}
              description={
                search
                  ? "Try a different name, city, or address."
                  : "Check back later as more hostels join Osstel."
              }
              size="sm"
            />
          ) : (
            <>
              {hostels.map((hostel) => (
                <HostelCard
                  key={hostel.id}
                  hostel={hostel}
                  styles={styles}
                  colors={colors}
                  onCall={handleCall}
                />
              ))}

              {hasMore ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.loadMoreBtn,
                    pressed && styles.loadMoreBtnPressed,
                    isFetching && styles.loadMoreBtnDisabled,
                  ]}
                  onPress={handleLoadMore}
                  disabled={isFetching}
                >
                  {isFetching && page > 1 ? (
                    <CustomLoading size="sm" />
                  ) : (
                    <Text style={styles.loadMoreText}>Load more hostels</Text>
                  )}
                </Pressable>
              ) : null}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

function createStyles(colors: AppColors, fonts: typeof FONTS, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
      backgroundColor: "transparent",
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: vs(20),
      paddingBottom: vs(110),
    },
    scrollContentEmpty: {
      flexGrow: 1,
    },
    introText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      lineHeight: vs(20),
      marginBottom: vs(16),
    },
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.white,
      borderRadius: vs(14),
      borderWidth: 1,
      borderColor: colors.white100,
      paddingHorizontal: vs(14),
      height: vs(48),
      marginBottom: vs(16),
    },
    searchIcon: {
      marginRight: vs(8),
    },
    searchInput: {
      flex: 1,
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.medium,
      color: colors.text,
      paddingVertical: 0,
    },
    loadingWrap: {
      paddingVertical: vs(32),
      alignItems: "center",
    },
    errorWrap: {
      backgroundColor: colors.errorBg,
      borderRadius: vs(12),
      padding: vs(12),
      marginBottom: vs(12),
    },
    errorText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.error,
      textAlign: "center",
    },
    card: {
      backgroundColor: colors.white,
      borderRadius: vs(16),
      borderWidth: 1,
      borderColor: colors.white100,
      padding: vs(14),
      marginBottom: vs(12),
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: vs(10),
      marginBottom: vs(12),
    },
    cardIconWrap: {
      width: vs(40),
      height: vs(40),
      borderRadius: vs(12),
      backgroundColor: isDark ? colors.primary100 : colors.primary100,
      alignItems: "center",
      justifyContent: "center",
    },
    cardHeaderText: {
      flex: 1,
    },
    cardTitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: vs(2),
    },
    cardSubtitle: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      lineHeight: vs(18),
    },
    vacancyBadge: {
      paddingHorizontal: vs(8),
      paddingVertical: vs(4),
      borderRadius: vs(10),
    },
    vacancyOpen: {
      backgroundColor: colors.successBg,
    },
    vacancyFull: {
      backgroundColor: colors.white100,
    },
    vacancyText: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.semiBold,
    },
    vacancyTextOpen: {
      color: colors.success,
    },
    vacancyTextFull: {
      color: colors.gray200,
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(8),
      marginBottom: vs(8),
    },
    detailText: {
      flex: 1,
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.text,
    },
    phoneRow: {
      gap: vs(8),
      marginTop: vs(4),
    },
    phoneBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(8),
      backgroundColor: colors.primary100,
      borderRadius: vs(12),
      paddingHorizontal: vs(12),
      paddingVertical: vs(10),
    },
    phoneBtnPressed: {
      opacity: 0.85,
    },
    phoneBtnText: {
      flex: 1,
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    loadMoreBtn: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: vs(14),
      borderRadius: vs(12),
      borderWidth: 1,
      borderColor: colors.primary200,
      backgroundColor: colors.white,
      marginTop: vs(4),
      minHeight: vs(44),
    },
    loadMoreBtnPressed: {
      backgroundColor: colors.primary100,
    },
    loadMoreBtnDisabled: {
      opacity: 0.7,
    },
    loadMoreText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
  });
}
