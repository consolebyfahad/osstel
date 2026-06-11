import CustomButton from "@/components/CustomButton";
import RoomCard from "@/components/RoomCard";
import { getRooms } from "@/services/rooms";
import { getTenants } from "@/services/tenants";
import type { Room } from "@/types/room";
import type { Tenant } from "@/types/tenant";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Rooms() {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getRooms(), getTenants()]).then(([roomList, tenantList]) => {
        setRooms(roomList);
        setTenants(tenantList);
      });
    }, []),
  );

  const handleAddRoom = () => {
    router.push("/rooms/add");
  };

  const handleAddTenant = (roomId: string) => {
    router.push({ pathname: "/tenants/add", params: { roomId } });
  };

  if (rooms.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name="door-open"
              size={vs(40)}
              color={colors.warning}
            />
          </View>

          <Text style={styles.title}>No rooms yet</Text>
          <Text style={styles.description}>
            Add your first room to start managing your hostel.
          </Text>
          <CustomButton title="Add Room" onPress={handleAddRoom} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Rooms</Text>
        <Pressable style={styles.addChip} onPress={handleAddRoom}>
          <MaterialCommunityIcons
            name="plus"
            size={vs(18)}
            color={colors.primary}
          />
          <Text style={styles.addChipText}>Add</Text>
        </Pressable>
      </View>

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <RoomCard
            room={item}
            tenants={tenants.filter((t) => t.roomId === item.id)}
            onAddTenant={handleAddTenant}
          />
        )}
      />
    </SafeAreaView>
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
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: vs(32),
      paddingBottom: vs(110),
    },
    iconWrap: {
      width: vs(88),
      height: vs(88),
      borderRadius: vs(20),
      backgroundColor: isDark ? "rgba(237, 161, 47, 0.15)" : "#FFEDD5",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: vs(24),
    },
    title: {
      fontSize: FONT_SIZES.xxl,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: vs(8),
      textAlign: "center",
    },
    description: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.gray200,
      textAlign: "center",
      lineHeight: vs(22),
      marginBottom: vs(28),
      maxWidth: vs(280),
    },
    listHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: vs(20),
      paddingTop: vs(16),
      paddingBottom: vs(12),
    },
    listTitle: {
      fontSize: FONT_SIZES.title,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    addChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(4),
      backgroundColor: colors.primary100,
      paddingHorizontal: vs(12),
      paddingVertical: vs(8),
      borderRadius: vs(20),
    },
    addChipText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    listContent: {
      paddingHorizontal: vs(20),
      paddingBottom: vs(110),
      gap: vs(14),
    },
  });
}
