import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";
import type {
  ComplaintsResponse,
  CreateComplaintBody,
  CreateComplaintResponse,
  GetComplaintsParams,
  GetMyComplaintsParams,
  UpdateComplaintStatusParams,
  UpdateComplaintStatusResponse,
} from "@/types/complaint";
import type { GoogleAuthBody, LoginBody, MeResponse, UpdateProfileBody, ChangePasswordBody } from "@/types/auth";
import type {
  HostelResponse,
  HostelsResponse,
  UpdateHostelBody,
} from "@/types/hostel";
import type {
  GetDiscoverHostelsParams,
  HostelDirectoryResponse,
} from "@/types/hostelDirectory";
import type {
  JoinHostelBody,
  JoinHostelResponse,
  JoinRequestsResponse,
  ApproveLeaveRequestResponse,
  LeaveRequestBody,
  LeaveRequestResponse,
  LeaveRequestsResponse,
} from "@/types/connection";
import type { CreateRoomResponse, UpdateRoomBody } from "@/types/room";
import type {
  DashboardActivitiesResponse,
  GetDashboardActivitiesParams,
} from "@/types/dashboard";
import type {
  PlansResponse,
  PlanRequestResponse,
  SubmitPlanRequestBody,
  SubmitPlanRequestResponse,
} from "@/types/subscription";
import type {
  CreateExpenseBody,
  CreateExpenseResponse,
  ExpenseSummaryResponse,
  ExpensesResponse,
  GetExpenseSummaryParams,
  GetExpensesParams,
} from "@/types/expense";
import type {
  CreateResidentBody,
  CreateResidentResponse,
  GetResidentsParams,
  ResidentLookupResponse,
  ResidentsResponse,
  UpdateResidentBody,
} from "@/types/resident";
import type {
  GetMyRentHistoryParams,
  GetMyRentParams,
  GetRentParams,
  MyRentHistoryResponse,
  MyRentResponse,
  SubmitRentPaymentBody,
  SubmitRentPaymentResponse,
  SendRentAlertBody,
  SendRentAlertResponse,
  SendResidentRentAlertParams,
  UpdateRentStatusParams,
  UpdateRentStatusResponse,
} from "@/types/rent";
import type {
  CreateRoomMeterBody,
  FinalizeRentBillBody,
  FinalizeRoomBillsBody,
  FinalizeRoomBillsResponse,
  RecordMeterReadingsBody,
  RentBillPreviewResponse,
  RoomMeterReadingsResponse,
  RoomMetersResponse,
  UpdateRoomMeterBody,
} from "@/types/meter";
import type {
  NotificationsResponse,
  RegisterPushTokenBody,
  RemovePushTokenBody,
  UnreadCountResponse,
} from "@/types/notification";
import type { SupportRequestsResponse, SubmitSupportResponse, SubmitSupportBody } from "@/types/support";
export const api = createApi({
  reducerPath: "api",
  tagTypes: ["Hostel", "Dashboard", "Rent", "Room", "Resident", "User", "Complaint", "Plan", "Support", "Notification", "Expense", "Connection"],
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    getMe: builder.query<MeResponse, void>({
      query: () => "/users/me",
      providesTags: ["User", "Connection"],
    }),

    updateMe: builder.mutation<MeResponse, UpdateProfileBody>({
      query: (body) => ({
        url: "/users/me",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    changePassword: builder.mutation<{ message: string }, ChangePasswordBody>({
      query: (body) => ({
        url: "/users/me/password",
        method: "PATCH",
        body,
      }),
    }),

    login: builder.mutation<unknown, LoginBody>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
    }),

    googleAuth: builder.mutation<unknown, GoogleAuthBody>({
      query: (body) => ({
        url: "/auth/google",
        method: "POST",
        body,
      }),
    }),

    register: builder.mutation({
      query: ({ name, phone, password, confirmPassword, role }) => ({
        url: "/auth/register",
        method: "POST",
        body: { name, phone, password, confirmPassword, role },
      }),
    }),

    logout: builder.mutation({
      queryFn: async (_arg, api, _extraOptions, fetchWithBQ) => {
        const state = api.getState() as {
          auth: { user: { refreshToken: string | null } | null };
        };
        const refreshToken = state.auth.user?.refreshToken;

        if (!refreshToken) {
          return { data: { message: "Logged out locally" } };
        }

        const result = await fetchWithBQ({
          url: "/auth/logout",
          method: "POST",
          body: { refreshToken },
        });

        if (result.error) {
          return { error: result.error };
        }

        return { data: result.data ?? {} };
      },
      invalidatesTags: ["User"],
    }),

    getHostels: builder.query<HostelsResponse, void>({
      query: () => "/hostels/me",
      providesTags: (result) =>
        result?.hostels?.length
          ? [
              ...result.hostels.map(({ _id }) => ({
                type: "Hostel" as const,
                id: _id,
              })),
              { type: "Hostel", id: "LIST" },
            ]
          : [{ type: "Hostel", id: "LIST" }],
    }),

    getDiscoverHostels: builder.query<
      HostelDirectoryResponse,
      GetDiscoverHostelsParams | void
    >({
      query: ({ search, page = 1, limit = 20 } = {}) => ({
        url: "/hostels/discover",
        params: {
          ...(search?.trim() ? { search: search.trim() } : {}),
          page,
          limit,
        },
      }),
      providesTags: [{ type: "Hostel", id: "DISCOVER" }],
    }),

    joinHostel: builder.mutation<JoinHostelResponse, JoinHostelBody>({
      query: (body) => ({
        url: "/resident/join-hostel",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User", "Connection"],
    }),

    createLeaveRequest: builder.mutation<LeaveRequestResponse, LeaveRequestBody>({
      query: (body) => ({
        url: "/resident/leave-request",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User", "Connection"],
    }),

    getManagerJoinRequests: builder.query<JoinRequestsResponse, void>({
      query: () => "/resident/manager/join-requests",
      providesTags: ["Connection"],
    }),

    approveJoinRequest: builder.mutation<{ message?: string }, string>({
      query: (id) => ({
        url: `/resident/manager/join-request/${id}/approve`,
        method: "PUT",
      }),
      invalidatesTags: ["Connection", "Resident", "User", "Dashboard"],
    }),

    rejectJoinRequest: builder.mutation<{ message?: string }, string>({
      query: (id) => ({
        url: `/resident/manager/join-request/${id}/reject`,
        method: "PUT",
      }),
      invalidatesTags: ["Connection"],
    }),

    getManagerLeaveRequests: builder.query<LeaveRequestsResponse, void>({
      query: () => "/resident/manager/leave-requests",
      providesTags: ["Connection"],
    }),

    approveLeaveRequest: builder.mutation<
      ApproveLeaveRequestResponse,
      { id: string; refundAmount?: number }
    >({
      query: ({ id, refundAmount }) => ({
        url: `/resident/manager/leave-request/${id}/approve`,
        method: "PUT",
        body: refundAmount !== undefined ? { refundAmount } : {},
      }),
      invalidatesTags: ["Connection", "Resident", "User", "Dashboard", "Rent", "Expense"],
    }),

    rejectLeaveRequest: builder.mutation<{ message?: string }, string>({
      query: (id) => ({
        url: `/resident/manager/leave-request/${id}/reject`,
        method: "PUT",
      }),
      invalidatesTags: ["Connection"],
    }),

    getHostel: builder.query<HostelResponse, string>({
      query: (hostelId) => `/hostels/${hostelId}`,
      providesTags: (_result, _error, hostelId) => [
        { type: "Hostel", id: hostelId },
      ],
    }),

    createHostel: builder.mutation({
      query: ({ name, address, city, contactPhone, image }) => ({
        url: "/hostels",
        method: "POST",
        body: { name, address, city, contactPhone, ...(image ? { image } : {}) },
      }),
      invalidatesTags: [{ type: "Hostel", id: "LIST" }, "Dashboard", "User"],
    }),

    updateHostel: builder.mutation<
      HostelResponse,
      { hostelId: string } & UpdateHostelBody
    >({
      query: ({ hostelId, ...body }) => ({
        url: `/hostels/${hostelId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { hostelId }) => [
        { type: "Hostel", id: hostelId },
        { type: "Hostel", id: "LIST" },
        "Dashboard",
        "User",
      ],
    }),

    deleteHostel: builder.mutation<{ message?: string }, string>({
      query: (hostelId) => ({
        url: `/hostels/${hostelId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, hostelId) => [
        { type: "Hostel", id: hostelId },
        { type: "Hostel", id: "LIST" },
        "Dashboard",
        "User",
        "Complaint",
        "Rent",
        "Resident",
        { type: "Room", id: hostelId },
      ],
    }),

    getHostelRooms: builder.query({
      query: (hostelId) => `/hostels/${hostelId}/rooms`,
      providesTags: (_result, _error, hostelId) => [
        { type: "Room", id: hostelId },
      ],
    }),

    createHostelRoom: builder.mutation({
      query: ({ hostelId, roomNumber, capacity, rent }) => ({
        url: `/hostels/${hostelId}/rooms`,
        method: "POST",
        body: { roomNumber, capacity, rent },
      }),
      invalidatesTags: (_result, _error, { hostelId }) => [
        { type: "Room", id: hostelId },
        "Dashboard",
      ],
    }),

    updateHostelRoom: builder.mutation<
      CreateRoomResponse,
      { hostelId: string; roomId: string } & UpdateRoomBody
    >({
      query: ({ hostelId, roomId, ...body }) => ({
        url: `/hostels/${hostelId}/rooms/${roomId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { hostelId }) => [
        { type: "Room", id: hostelId },
        "Dashboard",
        "Rent",
      ],
    }),

    deleteHostelRoom: builder.mutation<
      { message?: string },
      { hostelId: string; roomId: string }
    >({
      query: ({ hostelId, roomId }) => ({
        url: `/hostels/${hostelId}/rooms/${roomId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { hostelId }) => [
        { type: "Room", id: hostelId },
        { type: "Resident", id: hostelId },
        "Dashboard",
        "Rent",
      ],
    }),

    getDashboard: builder.query({
      query: () => "/dashboard",
      providesTags: ["Dashboard"],
    }),

    getDashboardActivities: builder.query<
      DashboardActivitiesResponse,
      GetDashboardActivitiesParams
    >({
      query: ({ hostelId, limit = 20 }) => ({
        url: "/dashboard/activities",
        params: { hostelId, limit },
      }),
      providesTags: (_result, _error, { hostelId }) => [
        { type: "Dashboard", id: `activities-${hostelId}` },
      ],
    }),

    getRent: builder.query({
      query: ({ hostelId, month, year, status }: GetRentParams) => ({
        url: "/rent",
        params: { hostelId, month, year, status },
      }),
      providesTags: ["Rent"],
    }),

    getMyRent: builder.query<MyRentResponse, GetMyRentParams>({
      query: ({ month, year }) => ({
        url: "/rent/me",
        params: { month, year },
      }),
      providesTags: ["Rent"],
    }),

    getMyRentHistory: builder.query<
      MyRentHistoryResponse,
      GetMyRentHistoryParams
    >({
      query: ({ year }) => ({
        url: "/rent/me/history",
        params: { year },
      }),
      transformResponse: (response: {
        year?: number;
        history?: MyRentHistoryResponse["records"];
        records?: MyRentHistoryResponse["records"];
        summary?: {
          paidAmount?: number;
          paidMonths?: number;
          pendingMonths?: number;
          totalPaid?: number;
          monthsPaid?: number;
          monthsPending?: number;
        };
      }): MyRentHistoryResponse => {
        const records = response.history ?? response.records ?? [];
        const summary = response.summary ?? {};
        return {
          year: response.year ?? new Date().getFullYear(),
          records,
          summary: {
            totalPaid: summary.totalPaid ?? summary.paidAmount ?? 0,
            monthsPaid: summary.monthsPaid ?? summary.paidMonths ?? 0,
            monthsPending: summary.monthsPending ?? summary.pendingMonths ?? 0,
          },
        };
      },
      providesTags: ["Rent"],
    }),

    submitRentPayment: builder.mutation<
      SubmitRentPaymentResponse,
      SubmitRentPaymentBody
    >({
      query: ({ rentId, ...body }) => ({
        url: `/rent/${rentId}/payment`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Rent"],
    }),

    updateRentStatus: builder.mutation<
      UpdateRentStatusResponse,
      UpdateRentStatusParams
    >({
      query: ({ rentId, hostelId, ...body }) => ({
        url: `/rent/${rentId}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { hostelId }) => [
        "Rent",
        { type: "Dashboard", id: hostelId },
      ],
    }),

    sendRentAlert: builder.mutation<
      SendRentAlertResponse,
      { rentId: string } & SendRentAlertBody
    >({
      query: ({ rentId, ...body }) => ({
        url: `/rent/${rentId}/alert`,
        method: "POST",
        body,
      }),
    }),

    sendResidentRentAlert: builder.mutation<
      SendRentAlertResponse,
      SendResidentRentAlertParams
    >({
      query: ({ tenancyId, ...body }) => ({
        url: `/residents/${tenancyId}/rent-alert`,
        method: "POST",
        body,
      }),
    }),

    getRentBillPreview: builder.query<RentBillPreviewResponse, string>({
      query: (paymentId) => `/rent/${paymentId}/bill-preview`,
    }),

    finalizeRentBill: builder.mutation<
      UpdateRentStatusResponse,
      { paymentId: string } & FinalizeRentBillBody
    >({
      query: ({ paymentId, ...body }) => ({
        url: `/rent/${paymentId}/finalize-bill`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Rent", "Dashboard"],
    }),

    getRoomMeters: builder.query<
      RoomMetersResponse,
      { hostelId: string; roomId: string }
    >({
      query: ({ hostelId, roomId }) =>
        `/hostels/${hostelId}/rooms/${roomId}/meters`,
      providesTags: (_result, _error, { roomId }) => [
        { type: "Room", id: `meters-${roomId}` },
      ],
    }),

    createRoomMeter: builder.mutation<
      { meter: RoomMetersResponse["meters"][number] },
      { hostelId: string; roomId: string } & CreateRoomMeterBody
    >({
      query: ({ hostelId, roomId, ...body }) => ({
        url: `/hostels/${hostelId}/rooms/${roomId}/meters`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { roomId }) => [
        { type: "Room", id: `meters-${roomId}` },
      ],
    }),

    updateRoomMeter: builder.mutation<
      { meter: RoomMetersResponse["meters"][number] },
      {
        hostelId: string;
        roomId: string;
        meterId: string;
      } & UpdateRoomMeterBody
    >({
      query: ({ hostelId, roomId, meterId, ...body }) => ({
        url: `/hostels/${hostelId}/rooms/${roomId}/meters/${meterId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { roomId }) => [
        { type: "Room", id: `meters-${roomId}` },
      ],
    }),

    deleteRoomMeter: builder.mutation<
      { message?: string },
      { hostelId: string; roomId: string; meterId: string }
    >({
      query: ({ hostelId, roomId, meterId }) => ({
        url: `/hostels/${hostelId}/rooms/${roomId}/meters/${meterId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { roomId }) => [
        { type: "Room", id: `meters-${roomId}` },
      ],
    }),

    getRoomMeterReadings: builder.query<
      RoomMeterReadingsResponse,
      { hostelId: string; roomId: string; month: number; year: number }
    >({
      query: ({ hostelId, roomId, month, year }) => ({
        url: `/hostels/${hostelId}/rooms/${roomId}/meter-readings`,
        params: { month, year },
      }),
      providesTags: (_result, _error, { roomId }) => [
        { type: "Room", id: `readings-${roomId}` },
      ],
    }),

    recordRoomMeterReadings: builder.mutation<
      RoomMeterReadingsResponse,
      { hostelId: string; roomId: string } & RecordMeterReadingsBody
    >({
      query: ({ hostelId, roomId, ...body }) => ({
        url: `/hostels/${hostelId}/rooms/${roomId}/meter-readings`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { roomId }) => [
        { type: "Room", id: `readings-${roomId}` },
        { type: "Room", id: `meters-${roomId}` },
        "Rent",
      ],
    }),

    finalizeRoomBills: builder.mutation<
      FinalizeRoomBillsResponse,
      { hostelId: string; roomId: string } & FinalizeRoomBillsBody
    >({
      query: ({ hostelId, roomId, ...body }) => ({
        url: `/hostels/${hostelId}/rooms/${roomId}/finalize-bills`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Rent", "Dashboard"],
    }),

    getComplaints: builder.query<ComplaintsResponse, GetComplaintsParams>({
      query: ({ hostelId, status }) => ({
        url: "/complaints",
        params: {
          hostelId,
          ...(status && status !== "all" ? { status } : {}),
        },
      }),
      providesTags: (_result, _error, { hostelId }) => [
        { type: "Complaint", id: hostelId },
      ],
    }),

    getMyComplaints: builder.query<ComplaintsResponse, GetMyComplaintsParams | void>({
      query: (params) => ({
        url: "/complaints/me",
        params:
          params?.status && params.status !== "all"
            ? { status: params.status }
            : undefined,
      }),
      providesTags: [{ type: "Complaint", id: "ME" }],
    }),

    createComplaint: builder.mutation<CreateComplaintResponse, CreateComplaintBody>({
      query: (body) => ({
        url: "/complaints",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Complaint", id: "ME" }, "Dashboard"],
    }),

    updateComplaintStatus: builder.mutation<
      UpdateComplaintStatusResponse,
      UpdateComplaintStatusParams
    >({
      query: ({ id, status }) => ({
        url: `/complaints/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { hostelId }) => [
        { type: "Complaint", id: hostelId },
        "Dashboard",
      ],
    }),

    getResidents: builder.query<ResidentsResponse, GetResidentsParams>({
      query: ({ hostelId, roomNumber, roomId }) => ({
        url: "/residents",
        params: {
          hostelId,
          ...(roomNumber ? { roomNumber } : {}),
          ...(roomId ? { roomId } : {}),
        },
      }),
      providesTags: (_result, _error, { hostelId }) => [
        { type: "Resident", id: hostelId },
      ],
    }),

    lookupResidentByUserId: builder.query<ResidentLookupResponse, string>({
      query: (userId) => `/residents/lookup/${encodeURIComponent(userId)}`,
    }),

    createResident: builder.mutation<
      CreateResidentResponse,
      CreateResidentBody
    >({
      query: (body) => ({
        url: "/residents",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { hostelId }) => [
        { type: "Resident", id: hostelId },
        "Dashboard",
        "Rent",
      ],
    }),

    updateResident: builder.mutation<
      CreateResidentResponse,
      { tenancyId: string } & UpdateResidentBody
    >({
      query: ({ tenancyId, ...body }) => ({
        url: `/residents/${tenancyId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Resident", "Dashboard", "Rent"],
    }),

    deleteResident: builder.mutation({
      query: (tenancyId) => ({
        url: `/residents/${tenancyId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Resident", "Dashboard", "Rent"],
    }),

    getPlans: builder.query<PlansResponse, void>({
      query: () => "/plans",
      providesTags: ["Plan"],
    }),

    getPlanRequest: builder.query<PlanRequestResponse, void>({
      query: () => "/plans/request",
      providesTags: ["Plan"],
    }),

    submitPlanRequest: builder.mutation<
      SubmitPlanRequestResponse,
      SubmitPlanRequestBody
    >({
      query: (body) => ({
        url: "/plans/request",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Plan", "User"],
    }),

    getSupportRequests: builder.query<SupportRequestsResponse, void>({
      query: () => "/support",
      providesTags: ["Support"],
    }),

    submitSupportRequest: builder.mutation<
      SubmitSupportResponse,
      SubmitSupportBody
    >({
      query: (body) => ({
        url: "/support",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Support"],
    }),

    registerPushToken: builder.mutation<void, RegisterPushTokenBody>({
      query: (body) => ({
        url: "/users/me/push-token",
        method: "PUT",
        body,
      }),
    }),

    removePushToken: builder.mutation<void, RemovePushTokenBody>({
      query: (body) => ({
        url: "/users/me/push-token",
        method: "DELETE",
        body,
      }),
    }),

    getNotifications: builder.query<NotificationsResponse, { page?: number } | void>({
      query: (params) => ({
        url: "/notifications",
        params: params ?? undefined,
      }),
      providesTags: ["Notification"],
    }),

    getUnreadNotificationCount: builder.query<UnreadCountResponse, void>({
      query: () => "/notifications/unread-count",
      providesTags: ["Notification"],
    }),

    markNotificationRead: builder.mutation<void, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notification"],
    }),

    markAllNotificationsRead: builder.mutation<void, void>({
      query: () => ({
        url: "/notifications/read-all",
        method: "PATCH",
      }),
      invalidatesTags: ["Notification"],
    }),

    getExpenses: builder.query<ExpensesResponse, GetExpensesParams>({
      query: ({ hostelId, month, year }) => ({
        url: "/expenses",
        params: { hostelId, month, year },
      }),
      providesTags: (_result, _error, { hostelId }) => [
        { type: "Expense", id: hostelId },
      ],
    }),

    getExpenseSummary: builder.query<
      ExpenseSummaryResponse,
      GetExpenseSummaryParams
    >({
      query: ({ hostelId, hostelIds, month, year }) => ({
        url: "/expenses/summary",
        params: { hostelId, hostelIds, month, year },
      }),
      providesTags: ["Expense"],
    }),

    createExpense: builder.mutation<CreateExpenseResponse, CreateExpenseBody>({
      query: (body) => ({
        url: "/expenses",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { hostelId }) => [
        { type: "Expense", id: hostelId },
        "Expense",
      ],
    }),
  }),
});

export const {
  useGetMeQuery,
  useUpdateMeMutation,
  useChangePasswordMutation,
  useLazyGetMeQuery,
  useLoginMutation,
  useGoogleAuthMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetHostelsQuery,
  useGetDiscoverHostelsQuery,
  useJoinHostelMutation,
  useCreateLeaveRequestMutation,
  useGetManagerJoinRequestsQuery,
  useApproveJoinRequestMutation,
  useRejectJoinRequestMutation,
  useGetManagerLeaveRequestsQuery,
  useApproveLeaveRequestMutation,
  useRejectLeaveRequestMutation,
  useGetHostelQuery,
  useCreateHostelMutation,
  useUpdateHostelMutation,
  useDeleteHostelMutation,
  useGetHostelRoomsQuery,
  useLazyGetHostelRoomsQuery,
  useCreateHostelRoomMutation,
  useUpdateHostelRoomMutation,
  useDeleteHostelRoomMutation,
  useGetDashboardQuery,
  useGetDashboardActivitiesQuery,
  useGetRentQuery,
  useLazyGetRentQuery,
  useGetMyRentQuery,
  useGetMyRentHistoryQuery,
  useSubmitRentPaymentMutation,
  useUpdateRentStatusMutation,
  useSendRentAlertMutation,
  useSendResidentRentAlertMutation,
  useGetRentBillPreviewQuery,
  useFinalizeRentBillMutation,
  useGetRoomMetersQuery,
  useCreateRoomMeterMutation,
  useUpdateRoomMeterMutation,
  useDeleteRoomMeterMutation,
  useGetRoomMeterReadingsQuery,
  useRecordRoomMeterReadingsMutation,
  useFinalizeRoomBillsMutation,
  useGetComplaintsQuery,
  useGetMyComplaintsQuery,
  useCreateComplaintMutation,
  useUpdateComplaintStatusMutation,
  useGetResidentsQuery,
  useLazyGetResidentsQuery,
  useLazyLookupResidentByUserIdQuery,
  useCreateResidentMutation,
  useUpdateResidentMutation,
  useDeleteResidentMutation,
  useGetPlansQuery,
  useGetPlanRequestQuery,
  useSubmitPlanRequestMutation,
  useGetSupportRequestsQuery,
  useSubmitSupportRequestMutation,
  useRegisterPushTokenMutation,
  useRemovePushTokenMutation,
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetExpensesQuery,
  useLazyGetExpenseSummaryQuery,
  useLazyGetExpensesQuery,
  useCreateExpenseMutation,
} = api;
