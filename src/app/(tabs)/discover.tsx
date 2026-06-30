import DiscoverHostelDirectoryCard from "@/components/DiscoverHostelDirectoryCard";
import EmptyState from "@/components/EmptyState";
import GradientBackground from "@/components/GradientBackground";
import GuestLoginModal from "@/components/GuestLoginModal";
import ScreenHeader from "@/components/ScreenHeader";
import CustomLoading from "@/components/CustomLoading";
import type { HostelDirectoryItem } from "@/types/hostelDirectory";
import { useGetDiscoverHostelsQuery } from "../../../store/api";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store/store";

export default function DiscoverTabScreen() {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const isGuest = !isAuthenticated;

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hostels, setHostels] = useState<HostelDirectoryItem[]>([]);
  const [loginModalVisible, setLoginModalVisible] = useState(false);

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

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScreenHeader
          title="Discover Hostels"
          rightSlot={
            isGuest ? (
              <Pressable
                style={styles.signInBtn}
                onPress={() => router.push("/auth/signin")}
              >
                <Text style={styles.signInText}>Sign In</Text>
              </Pressable>
            ) : null
          }
        />

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
          <Text style={styles.intro}>
            {isGuest
              ? "Browse hostels and vacancy. Sign in to view contact numbers and join your hostel."
              : "Browse registered hostels, check vacancy, and contact owners."}
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
                <DiscoverHostelDirectoryCard
                  key={hostel.id}
                  hostel={hostel}
                  isGuest={isGuest}
                  onContactLockedPress={() => setLoginModalVisible(true)}
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

      <GuestLoginModal
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
      />
    </GradientBackground>
  );
}

function createStyles(colors: AppColors, fonts: typeof FONTS, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1, backgroundColor: "transparent" },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: vs(20),
      paddingBottom: vs(110),
    },
    scrollContentEmpty: { flexGrow: 1 },
    intro: {
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
    searchIcon: { marginRight: vs(8) },
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
    loadMoreBtnPressed: { backgroundColor: colors.primary100 },
    loadMoreBtnDisabled: { opacity: 0.7 },
    loadMoreText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    signInBtn: {
      paddingHorizontal: vs(12),
      paddingVertical: vs(8),
      borderRadius: vs(20),
      backgroundColor: colors.primary,
    },
    signInText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.onPrimary,
    },
  });
}
