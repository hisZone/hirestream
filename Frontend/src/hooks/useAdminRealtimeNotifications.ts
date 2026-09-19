              queryClient.setQueryData(
                ['admin-notifications-unread-count'],
                (prev: number = 0) => prev + 1
              )

              queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })

              const title = notification.data?.title ?? 'New Notification'
              const message = notification.data?.message
              const actionUrl = notification.data?.action_url

              toast(title, {
                description: message,
                action: actionUrl
                  ? {
                      label: 'View',
                      onClick: () => navigate(actionUrl),
                    }
                  : undefined,
              })