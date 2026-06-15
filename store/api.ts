import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";
import type {
  ComplaintsResponse,
  GetComplaintsParams,
  UpdateComplaintStatusParams,
  UpdateComplaintStatusResponse,
} from "@/types/complaint";
import type { LoginBody, MeResponse, UpdateProfileBody } from "@/types/auth";
import type {
  HostelResponse,
  HostelsResponse,
  UpdateHostelBody,
} from "@/types/hostel";
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
  CreateResidentBody,
  CreateResidentResponse,
  GetResidentsParams,
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
  UpdateRentStatusParams,
  UpdateRentStatusResponse,
} from "@/types/rent";
import type {
  SubmitSupportBody,
  SubmitSupportResponse,
  SupportRequestsResponse,
} from "@/types/support";

export const api = createApi({
  reducerPath: "api",
  tagTypes: ["Hostel", "Dashboard", "Rent", "Room", "Resident", "User", "Complaint", "Plan", "Support"],
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    getMe: builder.query<MeResponse, void>({
      query: () => "/users/me",
      providesTags: ["User"],
    }),

    updateMe: builder.mutation<MeResponse, UpdateProfileBody>({
      query: (body) => ({
        url: "/users/me",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    login: builder.mutation<unknown, LoginBody>({
      query: (body) => ({
        url: "/auth/login",
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
      query: () => "/hostels",
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

    getHostel: builder.query<HostelResponse, string>({
      query: (hostelId) => `/hostels/${hostelId}`,
      providesTags: (_result, _error, hostelId) => [
        { type: "Hostel", id: hostelId },
      ],
    }),

    createHostel: builder.mutation({
      query: ({ name, address, city, contactPhone }) => ({
        url: "/hostels",
        method: "POST",
        body: { name, address, city, contactPhone },
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

    getComplaints: builder.query<ComplaintsResponse, GetComplaintsParams>({
      query: ({ hostelId, status }) => ({
        url: "/complaints",
        params: { hostelId, status },
      }),
      providesTags: (_result, _error, { hostelId }) => [
        { type: "Complaint", id: hostelId },
      ],
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
  }),
});

export const {
  useGetMeQuery,
  useUpdateMeMutation,
  useLazyGetMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetHostelsQuery,
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
  useGetComplaintsQuery,
  useUpdateComplaintStatusMutation,
  useGetResidentsQuery,
  useLazyGetResidentsQuery,
  useCreateResidentMutation,
  useUpdateResidentMutation,
  useDeleteResidentMutation,
  useGetPlansQuery,
  useGetPlanRequestQuery,
  useSubmitPlanRequestMutation,
  useGetSupportRequestsQuery,
  useSubmitSupportRequestMutation,
} = api;
