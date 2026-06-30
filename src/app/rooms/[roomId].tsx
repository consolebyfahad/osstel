import CustomButton from "@/components/CustomButton";
import CustomLoading from "@/components/CustomLoading";
import EmptyState from "@/components/EmptyState";
import GradientBackground from "@/components/GradientBackground";
import ProfileAvatar from "@/components/ProfileAvatar";
import ScreenHeader from "@/components/ScreenHeader";
import type { Resident } from "@/types/resident";
import type { Room } from "@/types/room";
import { formatCnic } from "@/utils/cnic";
import {
  getResidentMonthlyRent,
  getRoomTotalMonthlyRent,
} from "@/utils/room";
import {
  useDeleteResidentMutation,
  useGetHostelQuery,
  useGetHostelRoomsQuery,
  useGetResidentsQuery,
} from "../../../store/api";
import { useSubscription } from "@/hooks/useSubscription";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

function formatStatusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}

type RoomResidentRowProps = {
  resident: Resident;
  room: Room;
  styles: ReturnType<typeof createStyles>;
  colors: AppColors;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
};

function RoomResidentRow({
  resident,
  room,
  styles,
  colors,
  onEdit,
  onDelete,
  isDeleting,
}: RoomResidentRowProps) {
  const monthlyRent = getResidentMonthlyRent(resident, room.rent);

  return (
    <View style={styles.residentCard}>
      <Pressable style={styles.residentMain} onPress={onEdit}>
        <ProfileAvatar
          name={resident.name}
          phone={resident.phone}
          imageUri={resident.profileImage}
          size={vs(48)}
        />
        <View style={styles.residentContent}>
          <Text style={styles.residentName}>{resident.name}</Text>
          <Text style={styles.residentMeta}>
            {resident.phone} · Rs {monthlyRent.toLocaleString()}/mo
          </Text>
          {resident.userId ? (
            <Text style={styles.residentSubMeta}>ID: {resident.userId}</Text>
          ) : null}
          {resident.cnic ? (
            <Text style={styles.residentSubMeta}>{formatCnic(resident.cnic)}</Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={vs(18)} color={colors.gray200} />
      </Pressable>

      <View style={styles.residentActions}>
        <Pressable style={styles.actionBtn} onPress={onEdit}>
          <Ionicons name="create-outline" size={vs(18)} color={colors.primary} />
          <Text style={styles.actionBtnTextPrimary}>Edit</Text>
        </Pressable>
        <Pressable
          style={styles.actionBtn}
          onPress={onDelete}
          disabled={isDeleting}
        >
          <Ionicons name="trash-outline" size={vs(18)} color={colors.error} />
          <Text style={styles.actionBtnTextDanger}>
            {isDeleting ? "Removing..." : "Remove"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function RoomDetailScreen() {
  const { hostelId, roomId } = useLocalSearchParams<{
    hostelId: string;
    roomId: string;
  }>();
  const { colors, fonts, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark, insets.bottom),
    [colors, fonts, isDark, insets.bottom],
  );
  const { guardAddTenant } = useSubscription();
  const [deletingTenancyId, setDeletingTenancyId] = useState<string | null>(
    null,
  );

  const {
    data: hostelData,
    isLoading: isHostelLoading,
    refetch: refetchHostel,
  } = useGetHostelQuery(hostelId!, { skip: !hostelId });

  const {
    data: roomsData,
    isLoading: isRoomsLoading,
    refetch: refetchRooms,
  } = useGetHostelRoomsQuery(hostelId!, { skip: !hostelId });

  const {
    data: residentsData,
    isLoading: isResidentsLoading,
    isFetching: isResidentsFetching,
    refetch: refetchResidents,
  } = useGetResidentsQuery(
    { hostelId: hostelId!, roomId: roomId! },
    { skip: !hostelId || !roomId },
  );

  const [deleteResident] = useDeleteResidentMutation();

  const room = roomsData?.rooms?.find((item: Room) => item._id === roomId);
  const residents: Resident[] = residentsData?.residents ?? [];
  const occupied = residents.length;
  const vacantBeds = room ? Math.max(room.capacity - occupied, 0) : 0;
  const roomTotalRent = room ? getRoomTotalMonthlyRent(room, residents) : 0;

  useFocusEffect(
    useCallback(() => {
      if (hostelId) {
        refetchHostel();
        refetchRooms();
      }
      if (hostelId && roomId) {
        refetchResidents();
      }
    }, [hostelId, roomId, refetchHostel, refetchRooms, refetchResidents]),
  );

  const handleRefresh = useCallback(() => {
    refetchHostel();
    refetchRooms();
    refetchResidents();
  }, [refetchHostel, refetchRooms, refetchResidents]);

  const handleEditRoom = () => {
    if (!hostelId || !roomId) return;
    router.push({
      pathname: "/rooms/edit",
      params: { hostelId, roomId },
    });
  };

  const handleAddResident = () => {
    if (!hostelId || !roomId) return;
    guardAddTenant(() =>
      router.push({
        pathname: "/residents/add",
        params: { roomId, hostelId },
      }),
    );
  };

  const handleEditResident = (resident: Resident) => {
    router.push({
      pathname: "/residents/edit",
      params: {
        tenancyId: resident.tenancyId,
        hostelId: resident.hostelId,
      },
    });
  };

  const handleDeleteResident = (resident: Resident) => {
    Alert.alert(
      "Remove resident",
      `Mark ${resident.name} as moved out? They will lose access to this hostel.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setDeletingTenancyId(resident.tenancyId);
            try {
              await deleteResident(resident.tenancyId).unwrap();
            } catch (error) {
              const message =
                (error as { data?: { message?: string } })?.data?.message ??
                "Could not remove resident.";
              Alert.alert("Error", message);
            } finally {
              setDeletingTenancyId(null);
            }
          },
        },
      ],
    );
  };

  const isLoading = isHostelLoading || isRoomsLoading || isResidentsLoading;

  if (!hostelId || !roomId) {
    return (
      <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScreenHeader title="Room" showBack />
        <View style={styles.centerWrap}>
          <Text style={styles.errorText}>Missing room information.</Text>
        </View>
      </SafeAreaView>
    </GradientBackground>
    );
  }

  if (isLoading) {
    return (
      <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerWrap}>
          <CustomLoading size="lg" />
        </View>
      </SafeAreaView>
    </GradientBackground>
    );
  }

  if (!room) {
    return (
      <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScreenHeader title="Room" showBack />
        <View style={styles.centerWrap}>
          <Text style={styles.errorText}>Room not found.</Text>
        </View>
      </SafeAreaView>
    </GradientBackground>
    );
  }

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScreenHeader
        title={`Room ${room.roomNumber}`}
        showBack
        rightSlot={
          <Pressable style={styles.headerAction} onPress={handleEditRoom} hitSlop={12}>
            <Ionicons name="create-outline" size={vs(22)} color={colors.primary} />
          </Pressable>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isResidentsFetching && !isResidentsLoading}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {hostelData?.hostel?.name ? (
          <Text style={styles.hostelName}>{hostelData.hostel.name}</Text>
        ) : null}

        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={styles.roomIconWrap}>
              <MaterialCommunityIcons
                name="bed-outline"
                size={vs(24)}
                color={colors.secondary}
              />
            </View>
            <View style={styles.summaryText}>
              <Text style={styles.summaryTitle}>Room {room.roomNumber}</Text>
              <Text style={styles.summarySubtitle}>
                {formatStatusLabel(room.status)} · Rs {room.rent.toLocaleString()}
                /bed default
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{room.capacity}</Text>
              <Text style={styles.statLabel}>Beds</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{occupied}</Text>
              <Text style={styles.statLabel}>Occupied</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{vacantBeds}</Text>
              <Text style={styles.statLabel}>Vacant</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {roomTotalRent > 0 ? roomTotalRent.toLocaleString() : "0"}
              </Text>
              <Text style={styles.statLabel}>Rent/mo</Text>
            </View>
          </View>

          <View style={styles.progressBar}>
            {Array.from({ length: room.capacity }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.segment,
                  index < occupied ? styles.segmentFilled : styles.segmentEmpty,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.utilitiesCard}>
          <Text style={styles.utilitiesTitle}>Utilities & billing</Text>
          <Pressable
            style={styles.utilityRow}
            onPress={() =>
              router.push({
                pathname: "/rooms/meters",
                params: { hostelId, roomId },
              })
            }
          >
            <Ionicons name="speedometer-outline" size={vs(20)} color={colors.primary} />
            <View style={styles.utilityTextWrap}>
              <Text style={styles.utilityLabel}>Room meters</Text>
              <Text style={styles.utilityHint}>
                Electricity, gas, and custom meters
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={vs(18)} color={colors.gray200} />
          </Pressable>
          <Pressable
            style={styles.utilityRow}
            onPress={() =>
              router.push({
                pathname: "/rooms/meter-billing",
                params: { hostelId, roomId },
              })
            }
          >
            <Ionicons name="receipt-outline" size={vs(20)} color={colors.primary} />
            <View style={styles.utilityTextWrap}>
              <Text style={styles.utilityLabel}>Monthly readings & bills</Text>
              <Text style={styles.utilityHint}>
                Record usage and finalize rent with utilities
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={vs(18)} color={colors.gray200} />
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Residents</Text>
          <Text style={styles.sectionCount}>
            {occupied}/{room.capacity}
          </Text>
        </View>

        {residents.length === 0 ? (
          <EmptyState
            title="No residents in this room"
            description="Add a resident to assign them to this room."
            size="sm"
            style={styles.emptyState}
          />
        ) : (
          <View style={styles.residentsList}>
            {residents.map((resident) => (
              <RoomResidentRow
                key={resident.tenancyId}
                resident={resident}
                room={room}
                styles={styles}
                colors={colors}
                onEdit={() => handleEditResident(resident)}
                onDelete={() => handleDeleteResident(resident)}
                isDeleting={deletingTenancyId === resident.tenancyId}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {vacantBeds > 0 ? (
          <CustomButton title="Add Resident" onPress={handleAddResident} />
        ) : (
          <CustomButton title="Edit Room" onPress={handleEditRoom} variant="outline" />
        )}
      </View>
    </SafeAreaView>
    </GradientBackground>
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
    },
    safeArea: {
      flex: 1,
      backgroundColor: "transparent",
    },
    centerWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: vs(32),
    },
    errorText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.gray200,
      textAlign: "center",
    },
    headerAction: {
      width: vs(40),
      height: vs(40),
      alignItems: "center",
      justifyContent: "center",
    },
    scrollContent: {
      paddingHorizontal: vs(20),
      paddingBottom: vs(24),
    },
    hostelName: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.gray200,
      marginBottom: vs(12),
    },
    summaryCard: {
      backgroundColor: isDark ? colors.white100 : colors.white,
      borderRadius: vs(16),
      padding: vs(16),
      marginBottom: vs(20),
      borderWidth: 1,
      borderColor: isDark ? colors.white200 : colors.white100,
    },
    summaryTop: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: vs(16),
    },
    roomIconWrap: {
      width: vs(48),
      height: vs(48),
      borderRadius: vs(14),
      backgroundColor: colors.secondary100,
      alignItems: "center",
      justifyContent: "center",
      marginRight: vs(12),
    },
    summaryText: {
      flex: 1,
    },
    summaryTitle: {
      fontSize: FONT_SIZES.xl,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: vs(4),
    },
    summarySubtitle: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
    },
    statsRow: {
      flexDirection: "row",
      gap: vs(8),
      marginBottom: vs(16),
    },
    statItem: {
      flex: 1,
      backgroundColor: colors.primary100,
      borderRadius: vs(12),
      paddingVertical: vs(10),
      alignItems: "center",
    },
    statValue: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.bold,
      color: colors.primary,
      marginBottom: vs(2),
    },
    statLabel: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.medium,
      color: colors.gray200,
    },
    progressBar: {
      flexDirection: "row",
      gap: vs(6),
    },
    segment: {
      flex: 1,
      height: vs(8),
      borderRadius: vs(4),
    },
    segmentFilled: {
      backgroundColor: colors.primary,
    },
    segmentEmpty: {
      backgroundColor: colors.primary100,
    },
    utilitiesCard: {
      backgroundColor: isDark ? colors.white100 : colors.white,
      borderRadius: vs(16),
      padding: vs(14),
      marginBottom: vs(20),
      borderWidth: 1,
      borderColor: isDark ? colors.white300 : colors.white100,
      gap: vs(8),
    },
    utilitiesTitle: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.gray300,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: vs(4),
    },
    utilityRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(12),
      paddingVertical: vs(8),
    },
    utilityTextWrap: { flex: 1 },
    utilityLabel: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    utilityHint: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      marginTop: vs(2),
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: vs(12),
    },
    sectionTitle: {
      fontSize: FONT_SIZES.xl,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    sectionCount: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.gray200,
    },
    emptyState: {
      marginBottom: vs(8),
    },
    residentsList: {
      gap: vs(12),
    },
    residentCard: {
      backgroundColor: isDark ? colors.white100 : colors.white,
      borderRadius: vs(16),
      borderWidth: 1,
      borderColor: isDark ? colors.white200 : colors.white100,
      overflow: "hidden",
    },
    residentMain: {
      flexDirection: "row",
      alignItems: "center",
      padding: vs(14),
      gap: vs(12),
    },
    residentContent: {
      flex: 1,
    },
    residentName: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: vs(4),
    },
    residentMeta: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
    },
    residentSubMeta: {
      marginTop: vs(4),
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.medium,
      color: colors.gray100,
    },
    residentActions: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor: isDark ? colors.white200 : colors.white100,
    },
    actionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: vs(6),
      paddingVertical: vs(12),
    },
    actionBtnTextPrimary: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    actionBtnTextDanger: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.error,
    },
    footer: {
      paddingHorizontal: vs(20),
      paddingTop: vs(12),
      paddingBottom: Math.max(bottomInset, vs(20)),
      borderTopWidth: 1,
      borderTopColor: colors.white100,
      backgroundColor: "transparent",
    },
  });
}
