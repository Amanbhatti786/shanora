  const handleAuth = async (e) => {
    e.preventDefault();
    console.log("--- Form Submitted ---");
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const cleanEmail = formData.email ? formData.email.trim().toLowerCase() : '';
      console.log("Email being processed:", cleanEmail);

      if (isSignup) {
        if (!formData.agreeTerms) {
          setErrorMessage('You must agree to the Terms & Conditions and Privacy Policy.');
          setLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          setErrorMessage('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }

        // 1. Check unique username
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', formData.username.trim())
          .maybeSingle();

        if (existingUser) {
          setErrorMessage('Username is already taken. Please choose another.');
          setLoading(false);
          return;
        }

        // 2. Supabase Signup
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: formData.password,
          options: {
            data: {
              full_name: `${formData.firstName} ${formData.lastName}`,
              username: formData.username.trim(),
              account_type: formData.accountType
            }
          }
        });

        if (authError) throw authError;

        if (!authData.user) {
          throw new Error('User registration failed. Please try again.');
        }

        // 3. Upsert into profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: cleanEmail,
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            full_name: `${formData.firstName} ${formData.lastName}`,
            username: formData.username.trim().toLowerCase(),
            country: formData.country,
            account_type: formData.accountType,
            date_of_birth: formData.dob || null,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });

        if (profileError) throw profileError;

        setSuccessMessage('Registration successful! Please check your email for verification link.');
        setTimeout(() => {
          router.push('/profile?tab=profile');
        }, 2000);

      } else {
        // Sign In Flow
        console.log("Attempting Sign In...");
        const { data, error: signinError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: formData.password
        });

        console.log("SignIn Result - Data:", data, "Error:", signinError);

        if (signinError) throw signinError;

        console.log("Sign in successful! Redirecting to /feed...");
        router.push('/feed');
      }

    } catch (err) {
      console.error("Caught Auth Error:", err);
      setErrorMessage(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };
