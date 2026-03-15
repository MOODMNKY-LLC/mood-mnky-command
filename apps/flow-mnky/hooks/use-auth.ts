'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { client } from '@/lib/management-api'
import type { components } from '@/lib/management-api-schema'

const getAuthConfig = async (projectRef: string) => {
  const { data, error } = await client.GET('/v1/projects/{ref}/config/auth', {
    params: {
      path: { ref: projectRef },
    },
  })
  if (error) {
    throw error
  }

  return data
}

export const useGetAuthConfig = (projectRef: string) => {
  return useQuery({
    queryKey: ['auth-config', projectRef],
    queryFn: () => getAuthConfig(projectRef),
    enabled: !!projectRef,
    retry: false,
  })
}

// UPDATE Auth Config
const updateAuthConfig = async ({
  projectRef,
  payload,
}: {
  projectRef: string
  payload: components['schemas']['UpdateAuthConfigBody']
}) => {
  const { data, error } = await client.PATCH('/v1/projects/{ref}/config/auth', {
    params: {
      path: {
        ref: projectRef,
      },
    },
    body: payload,
  })
  if (error) {
    throw error
  }

  return data
}

export const useUpdateAuthConfig = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateAuthConfig,
    onSuccess: (data, variables) => {
      toast.success(`Auth config updated.`)
      queryClient.invalidateQueries({
        queryKey: ['auth-config', variables.projectRef],
      })
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'There was a problem with your request.')
    },
  })
}
