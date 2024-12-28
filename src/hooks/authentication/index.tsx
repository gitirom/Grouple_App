import { onSignUpUser } from "@/actions/auth"
import { SignInSchema } from "@/components/forms/sign-in/schema"
import { SignUpSchema } from "@/components/forms/sign-up/schema"
import { useSignIn, useSignUp } from "@clerk/nextjs"
import { OAuthStrategy } from "@clerk/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

export const useAuthSignIn = () => {
    const { isLoaded, setActive, signIn } = useSignIn() // Retrieves Clerk authentication methods
    const {
        register,  // Registers form fields for validation
        formState: { errors },  // Tracks validation errors
        reset,  // Resets form state
        handleSubmit,  // Handles form submission
    } = useForm<z.infer<typeof SignInSchema>>({
        resolver: zodResolver(SignInSchema),  // Uses zod for schema validation
        mode: "onBlur",  // Triggers validation on blur
    })

    const router = useRouter()   // Initializes Next.js router

    const onClerkAuth = async (email: string, password: string) => {
        if (!isLoaded)  // Checks if Clerk authentication is ready
            return toast("Error", {
                description: "Oops! something went wrong",  // Error message if not loaded
            })
        
        try {
            const authenticated = await signIn.create({  // Attempts to sign in the user with email and password
                identifier: email,
                password: password,
            })
        
            if (authenticated.status === "complete") {  // Checks if sign-in was successful
                reset()  // Resets the form state
                await setActive({ session: authenticated.createdSessionId })  // Sets user session as active
                toast("Success", {
                    description: "Welcome back!",  // Success message
                })
                router.push("/callback/sign-in")  // Redirects to the callback page
            }
        } catch (error: any) {
            if (error.errors[0].code === "form_password_incorrect")
                toast("Error", {
                    description: "email/password is incorrect try again",  // Error message for incorrect credentials
                })
        }
    }

    // Handles mutation for initiating login flow and manages loading state
    const { mutate: InitiateLoginFlow, isPending } = useMutation({
        mutationFn: ({ email, password }: { email: string; password: string }) =>
            onClerkAuth(email, password),
    })

    const onAuthenticateUser = handleSubmit(async (values) => {
        InitiateLoginFlow({ email: values.email, password: values.password })  // Triggers authentication on form submit
    })

    return {
        onAuthenticateUser,  // Exposes form submit handler
        isPending,  // Exposes loading state
        register,  // Exposes form register function
        errors,  // Exposes form errors
    }
}


// Export a custom hook for handling sign-up functionality
export const useAuthSignUp = () => {
    // Destructure necessary functions and states from the Clerk `useSignUp` hook
    const { setActive, isLoaded, signUp } = useSignUp()

    // Local state to manage the creating and verifying states
    const [creating, setCreating] = useState<boolean>(false) // Tracks if the user creation process is in progress
    const [verifying, setVerifying] = useState<boolean>(false) // Tracks if the verification process is in progress
    const [code, setCode] = useState<string>("") // Holds the verification code entered by the user

    // Set up form handling with react-hook-form and integrate Zod schema for validation
    const {
        register, // Registers input fields for form handling
        formState: { errors }, // Provides error messages for invalid fields
        reset, // Resets the form to its initial state
        handleSubmit, // Handles form submission
        getValues, // Retrieves the current form values
    } = useForm<z.infer<typeof SignUpSchema>>({
        resolver: zodResolver(SignUpSchema), // Uses Zod for form validation
        mode: "onBlur", // Validates fields when they lose focus
    })

    // Get the Next.js router instance for navigation
    const router = useRouter()

    // Function to generate a verification code after sign-up
    const onGenerateCode = async (email: string, password: string) => {
        if (!isLoaded) // Check if Clerk's sign-up state is loaded
            return toast("Error", {
                description: "Oops! something went wrong", // Display an error toast if not loaded
            })
        try {
            if (email && password) { // Ensure both email and password are provided
                await signUp.create({ // Create a new user using Clerk
                    emailAddress: getValues("email"), // Use the email from the form
                    password: getValues("password"), // Use the password from the form
                })

                await signUp.prepareEmailAddressVerification({ // Prepare email verification
                    strategy: "email_code", // Use an email code for verification
                })

                setVerifying(true) // Set the verifying state to true
            } else {
                return toast("Error", { // Display an error if fields are empty
                    description: "No fields must be empty",
                })
            }
        } catch (error) {
            console.error(JSON.stringify(error, null, 2)) // Log any errors that occur
        }
    }

    // Function to initiate user registration and complete the verification process
    const onInitiateUserRegistration = handleSubmit(async (values) => {
        if (!isLoaded) // Check if Clerk's sign-up state is loaded
            return toast("Error", {
                description: "Oops! something went wrong", // Display an error toast if not loaded
            })

        try {
            setCreating(true) // Set the creating state to true
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code, // Attempt email verification using the code
            })

            if (completeSignUp.status !== "complete") { // Check if the sign-up process is incomplete
                return toast("Error", {
                    description: "Oops! something went wrong, status incomplete",
                })
            }

            if (completeSignUp.status === "complete") { // If sign-up is complete
                if (!signUp.createdUserId) return // Ensure a user ID was created
                const user = await onSignUpUser({ // Call a custom function to create the user in the database
                    firstname: values.firstname, // Use the form's first name
                    lastname: values.lastname, // Use the form's last name
                    clerkId: signUp.createdUserId, // Use the user ID from Clerk
                    image: "", // Placeholder for the user's image
                })

                reset() // Reset the form

                if (user.status === 200) { // If user creation is successful
                    toast("Success", { // Display a success toast
                        description: user.message,
                    })
                    await setActive({ // Set the active session for the user
                        session: completeSignUp.createdSessionId,
                    })
                    router.push(`/group/create`) // Navigate to the group creation page
                }
                if (user.status !== 200) { // Handle unsuccessful user creation
                    toast("Error", {
                        description: user.message + "action failed",
                    })
                    router.refresh // Refresh the page
                }
                setCreating(false) // Reset the creating state
                setVerifying(false) // Reset the verifying state
            } else {
                console.error(JSON.stringify(completeSignUp, null, 2)) // Log errors if the sign-up is incomplete
            }
        } catch (error) {
            console.error(JSON.stringify(error, null, 2)) // Log any errors that occur
        }
    })

    // Return all necessary properties and functions for external use
    return {
        register, // Expose the register function for input fields
        errors, // Expose form errors
        onGenerateCode, // Expose the function to generate a verification code
        onInitiateUserRegistration, // Expose the function to complete registration
        verifying, // Expose the verifying state
        creating, // Expose the creating state
        code, // Expose the code state
        setCode, // Expose the function to update the code
        getValues, // Expose the function to retrieve form values
    }
}

// A custom hook for handling Google OAuth authentication
export const useGoogleAuth = () => {
    const { signIn, isLoaded: LoadedSignIn } = useSignIn()
    const { signUp, isLoaded: LoadedSignUp } = useSignUp()
    
        const signInWith = (strategy: OAuthStrategy) => {
        if (!LoadedSignIn) return
        try {
            return signIn.authenticateWithRedirect({
            strategy,
            redirectUrl: "/callback",
            redirectUrlComplete: "/callback/sign-in",
            })
        } catch (error) {
            console.error(error)
        }
        }
    
        const signUpWith = (strategy: OAuthStrategy) => {
        if (!LoadedSignUp) return
        try {
            return signUp.authenticateWithRedirect({
            strategy,
            redirectUrl: "/callback",
            redirectUrlComplete: "/callback/complete",
            })
        } catch (error) {
            console.error(error)
        }
        }
    
        return { signUpWith, signInWith }
    }
