    onSuccess: async () => {
      toast.success(t('auth.emailVerified', 'Email verified successfully'))
      const updatedUser = await getProfile()
      if (updatedUser?.role === 'employer') {
        navigate('/employer-dashboard')
      } else {
        navigate('/dashboard')
      }
    },