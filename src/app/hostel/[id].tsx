import CustomButton from "@/components/CustomButton";
import RoomCard from "@/components/RoomCard";
import ScreenHeader from "@/components/ScreenHeader";
import type { Resident } from "@/types/resident";
import type { Room } from "@/types/room";
import {
  useGetHostelQuery,
  useGetHostelRoomsQuery,
  useGetResidentsQuery,
} from "../../../store/api";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo } from "react";
import CustomLoading from "@/components/CustomLoading";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

function getManagerName(manager: unknown) {
  if (typeof manager === "object" && manager && "name" in manager) {
    return String((manager as { name: string }).name);
  }
  return null;
}

export default function HostelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, fonts, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark, insets.bottom),
    [colors, fonts, isDark, insets.bottom],
  );

  const {
    data: hostelData,
    isLoading: isHostelLoading,
    isError: isHostelError,
    refetch: refetchHostel,
  } = useGetHostelQuery(id!, { skip: !id });

  const hostel = hostelData?.hostel;

  const {
    data: roomsData,
    isLoading: isRoomsLoading,
    refetch: refetchRooms,
  } = useGetHostelRoomsQuery(id!, { skip: !id });

  const {
    data: residentsData,
    refetch: refetchResidents,
  } = useGetResidentsQuery({ hostelId: id! }, { skip: !id });

  const rooms: Room[] = roomsData?.rooms ?? [];
  const residents: Resident[] = residentsData?.residents ?? [];

  useFocusEffect(
    useCallback(() => {
      if (id) {
        refetchHostel();
        refetchRooms();
        refetchResidents();
      }
    }, [id, refetchHostel, refetchRooms, refetchResidents]),
  );

  const totalBeds = useMemo(
    () => rooms.reduce((sum, room) => sum + room.capacity, 0),
    [rooms],
  );

  const occupiedBeds = useMemo(() => residents.length, [residents]);

  const vacantBeds = Math.max(totalBeds - occupiedBeds, 0);
  const managerName = hostel ? getManagerName(hostel.manager) : null;

  const handleAddRoom = () => {
    router.push({ pathname: "/rooms/add", params: { hostelId: id } });
  };

  const handleAddResident = (roomId: string) => {
    router.push({
      pathname: "/residents/add",
      params: { roomId, hostelId: id },
    });
  };

  const handleEditRoom = (roomId: string) => {
    router.push({
      pathname: "/rooms/edit",
      params: { hostelId: id, roomId },
    });
  };

  if (isHostelLoading || isRoomsLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingWrap}>
          <CustomLoading size="lg" />
        </View>
      </SafeAreaView>
    );
  }

  if (isHostelError || !hostel) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScreenHeader title="Hostel" showBack />
        <View style={styles.notFoundWrap}>
          <Text style={styles.notFoundText}>Hostel not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader
        title={hostel.name}
        showBack
        titleNumberOfLines={1}
        rightSlot={
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push(`/hostel/edit/${id}`)}
            hitSlop={12}
          >
            <Ionicons name="create-outline" size={vs(22)} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={vs(18)} color={colors.gray200} />
            <Text style={styles.infoText}>
              {hostel.address}, {hostel.city}
            </Text>
          </View>
          {hostel.contactPhone ? (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={vs(18)} color={colors.gray200} />
              <Text style={styles.infoText}>{hostel.contactPhone}</Text>
            </View>
          ) : null}
          {managerName ? (
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={vs(18)} color={colors.gray200} />
              <Text style={styles.infoText}>{managerName}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{rooms.length}</Text>
            <Text style={styles.statLabel}>Rooms</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalBeds}</Text>
            <Text style={styles.statLabel}>Beds</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{vacantBeds}</Text>
            <Text style={styles.statLabel}>Vacant</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Rooms</Text>

        {rooms.length === 0 ? (
          <View style={styles.emptyRooms}>
            <MaterialCommunityIcons
              name="door-open"
              size={vs(36)}
              color={colors.warning}
            />
            <Text style={styles.emptyTitle}>No rooms yet</Text>
            <Text style={styles.emptyDescription}>
              Add the first room for {hostel.name}.
            </Text>
          </View>
        ) : (
          <View style={styles.roomsList}>
            {rooms.map((item) => (
              <RoomCard
                key={item._id}
                room={item}
                residents={residents.filter(
                  (resident) => resident.roomId === item._id,
                )}
                onAddResident={handleAddResident}
                onEdit={handleEditRoom}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <CustomButton title="Add Room" onPress={handleAddRoom} />
      </View>
    </SafeAreaView>
  );
}

function createStyles(
  colors: AppColors,
  fonts: typeof FONTS,
  isDark: boolean,
  bottomInset: number,
) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: vs(16),
      paddingVertical: vs(12),
    },
    backButton: {
      width: vs(40),
      height: vs(40),
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      fontSize: FONT_SIZES.xl,
      fontFamily: fonts.bold,
      color: colors.text,
      textAlign: "center",
    },
    headerSpacer: {
      width: vs(40),
    },
    editButton: {
      width: vs(40),
      height: vs(40),
      alignItems: "center",
      justifyContent: "center",
    },
    notFoundWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    notFoundText: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.medium,
      color: colors.gray200,
    },
    scrollContent: {
      paddingHorizontal: vs(20),
      paddingBottom: vs(24),
    },
    infoCard: {
      backgroundColor: isDark ? colors.white100 : colors.white,
      borderRadius: vs(16),
      padding: vs(16),
      marginBottom: vs(16),
      borderWidth: 1,
      borderColor: isDark ? colors.white200 : colors.white100,
      gap: vs(10),
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: vs(10),
    },
    infoText: {
      flex: 1,
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.text,
      lineHeight: vs(22),
    },
    statsRow: {
      flexDirection: "row",
      gap: vs(10),
      marginBottom: vs(20),
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.primary100,
      borderRadius: vs(14),
      paddingVertical: vs(14),
      alignItems: "center",
    },
    statValue: {
      fontSize: FONT_SIZES.xxl,
      fontFamily: fonts.bold,
      color: colors.primary,
      marginBottom: vs(2),
    },
    statLabel: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.gray200,
    },
    sectionTitle: {
      fontSize: FONT_SIZES.xl,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: vs(12),
    },
    emptyRooms: {
      alignItems: "center",
      paddingVertical: vs(32),
      paddingHorizontal: vs(24),
      backgroundColor: isDark ? colors.white100 : colors.white,
      borderRadius: vs(16),
      borderWidth: 1,
      borderColor: isDark ? colors.white200 : colors.white100,
    },
    emptyTitle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.bold,
      color: colors.text,
      marginTop: vs(12),
      marginBottom: vs(6),
    },
    emptyDescription: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.gray200,
      textAlign: "center",
      lineHeight: vs(22),
    },
    roomsList: {
      gap: vs(14),
    },
    footer: {
      paddingHorizontal: vs(20),
      paddingTop: vs(12),
      paddingBottom: Math.max(bottomInset, vs(20)),
      borderTopWidth: 1,
      borderTopColor: colors.white100,
      backgroundColor: colors.background,
    },
  });
}
