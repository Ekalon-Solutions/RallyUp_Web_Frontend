"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, User, Mail, Phone, UserPlus, LogIn, Crown, Building2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { RecaptchaVerifier, signInWithPhoneNumber, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth"
import { auth } from "@/lib/firebase/config"
import { isDevelopment, debugLog } from "@/lib/config"

const DEBUG_OTP = "123456"

const validateEmail = (email: string): string => {
  if (!email) return ""
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address"
  }
  return ""
}

const validatePhoneNumber = (phone: string): string => {
  if (!phone) return ""
  const phoneRegex = /^\d{10,15}$/
  if (!phoneRegex.test(phone)) {
    return "Phone number must be 10-15 digits"
  }
  return ""
}

const validateAadhar = (aadhar: string): string => {
  if (!aadhar) return ""
  const aadharRegex = /^\d{12}$/
  if (!aadharRegex.test(aadhar)) {
    return "Aadhar number must be exactly 12 digits"
  }
  if (/^(\d)\1{11}$/.test(aadhar)) {
    return "Aadhar number cannot be all the same digit"
  }
  return ""
}

const validateZipCode = (zipCode: string, country?: string): string => {
  if (!zipCode) return ""
  const zipRegex = /^[A-Za-z0-9]{5,10}$/
  if (!zipRegex.test(zipCode)) {
    return "ZIP code must be 5-10 alphanumeric characters"
  }
  if (country === "India") {
    const indiaZipRegex = /^\d{6}$/
    if (!indiaZipRegex.test(zipCode)) {
      return "Indian PIN code must be exactly 6 digits"
    }
  } else if (country === "United States") {
    const usZipRegex = /^\d{5}(-\d{4})?$/
    if (!usZipRegex.test(zipCode)) {
      return "US ZIP code must be 5 digits or 5+4 format"
    }
  }
  return ""
}

const validateDOB = (dob: string): string => {
  if (!dob) return ""
  const today = new Date()
  const birthDate = new Date(dob)
  const age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (birthDate > today) {
    return "Date of birth cannot be in the future"
  }
  
  const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age
  
  if (actualAge < 13) {
    return "You must be at least 13 years old"
  }
  
  if (actualAge > 120) {
    return "Please enter a valid date of birth"
  }
  
  return ""
}

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const setupRecaptcha = (phoneNumber: string) => {

  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': (response: any) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
        // console.log("reCAPTCHA solved for phone number:", phoneNumber)
      }
    });
  }
  return window.recaptchaVerifier
}

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("user-login")
  const [otpButtonLoading, setOtpButtonLoading] = useState(false)
  const { login, register, isAuthenticated } = useAuth()
  const router = useRouter()

  const [userLoginData, setUserLoginData] = useState({ email: "", phone_number: "", countryCode: "+91" })
  const [userRegisterData, setUserRegisterData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "male" as "male" | "female" | "non-binary",
    phone_number: "",
    countryCode: "+91",
    address_line1: "",
    address_line2: "",
    city: "",
    state_province: "",
    zip_code: "",
    country: "",
    level_name: "",
    id_proof_type: "Aadhar" as "Aadhar" | "Voter ID" | "Passport" | "Driver License",
    id_proof_number: "",
    clubId: "",
    membershipPlanId: ""
  })

  const [adminLoginData, setAdminLoginData] = useState({ email: "", phoneNumber: "", countryCode: "+91" })
  const [adminRegisterData, setAdminRegisterData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    countryCode: "+91",
    adminCode: ""
  })

  const [systemOwnerLoginData, setSystemOwnerLoginData] = useState({ email: "", phoneNumber: "", countryCode: "+91" })
  const [systemOwnerRegisterData, setSystemOwnerRegisterData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    countryCode: "+91",
    accessKey: ""
  })

  const [userOtpSent, setUserOtpSent] = useState(false)
  const [adminOtpSent, setAdminOtpSent] = useState(false)
  const [systemOwnerOtpSent, setSystemOwnerOtpSent] = useState(false)
  const [userOtp, setUserOtp] = useState("")
  const [adminOtp, setAdminOtp] = useState("")
  const [systemOwnerOtp, setSystemOwnerOtp] = useState("")
  const [generatedOtp, setGeneratedOtp] = useState("")

  const [userLoginOtpSent, setUserLoginOtpSent] = useState(false)
  const [adminLoginOtpSent, setAdminLoginOtpSent] = useState(false)
  const [systemOwnerLoginOtpSent, setSystemOwnerLoginOtpSent] = useState(false)
  const [userLoginOtp, setUserLoginOtp] = useState("")
  const [adminLoginOtp, setAdminLoginOtp] = useState("")
  const [systemOwnerLoginOtp, setSystemOwnerLoginOtp] = useState("")
  const [generatedLoginOtp, setGeneratedLoginOtp] = useState("")

  const [userLoginResendCountdown, setUserLoginResendCountdown] = useState(0)
  const [adminLoginResendCountdown, setAdminLoginResendCountdown] = useState(0)
  const [systemOwnerLoginResendCountdown, setSystemOwnerLoginResendCountdown] = useState(0)
  const [userRegisterResendCountdown, setUserRegisterResendCountdown] = useState(0)
  const [adminRegisterResendCountdown, setAdminRegisterResendCountdown] = useState(0)
  const [systemOwnerRegisterResendCountdown, setSystemOwnerRegisterResendCountdown] = useState(0)

  const [userLoginErrors, setUserLoginErrors] = useState({ email: "", phone_number: "" })
  const [userRegisterErrors, setUserRegisterErrors] = useState({
    email: "",
    phone_number: "",
    date_of_birth: "",
    zip_code: "",
    id_proof_number: ""
  })
  const [adminLoginErrors, setAdminLoginErrors] = useState({ email: "", phoneNumber: "" })
  const [adminRegisterErrors, setAdminRegisterErrors] = useState({ email: "", phone_number: "" })
  const [systemOwnerLoginErrors, setSystemOwnerLoginErrors] = useState({ email: "", phoneNumber: "" })
  const [systemOwnerRegisterErrors, setSystemOwnerRegisterErrors] = useState({ email: "", phone_number: "" })

  useEffect(() => {
    if (userLoginResendCountdown > 0) {
      const timer = setTimeout(() => setUserLoginResendCountdown(userLoginResendCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [userLoginResendCountdown])

  useEffect(() => {
    if (adminLoginResendCountdown > 0) {
      const timer = setTimeout(() => setAdminLoginResendCountdown(adminLoginResendCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [adminLoginResendCountdown])

  useEffect(() => {
    if (systemOwnerLoginResendCountdown > 0) {
      const timer = setTimeout(() => setSystemOwnerLoginResendCountdown(systemOwnerLoginResendCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [systemOwnerLoginResendCountdown])

  useEffect(() => {
    if (userRegisterResendCountdown > 0) {
      const timer = setTimeout(() => setUserRegisterResendCountdown(userRegisterResendCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [userRegisterResendCountdown])

  useEffect(() => {
    if (adminRegisterResendCountdown > 0) {
      const timer = setTimeout(() => setAdminRegisterResendCountdown(adminRegisterResendCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [adminRegisterResendCountdown])

  useEffect(() => {
    if (systemOwnerRegisterResendCountdown > 0) {
      const timer = setTimeout(() => setSystemOwnerRegisterResendCountdown(systemOwnerRegisterResendCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [systemOwnerRegisterResendCountdown])

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (typeof window === "undefined") return
    const url = window.location.href
    try {
      if (isSignInWithEmailLink(auth, url)) {
        let email = window.localStorage.getItem("emailForSignIn")
        if (!email) {
          email = window.prompt("Please provide your email for confirmation") || undefined
        }
        if (!email) {
          toast.error("Email is required to complete sign-in.")
          return
        }

        signInWithEmailLink(auth, email, url)
          .then(async (result) => {
            const signInType = window.localStorage.getItem("emailSignInType") || "user"
            try {
              if (signInType === "user") {
                await login(email, "", "", false)
              } else if (signInType === "admin") {
                await login(email, "", "", true)
              } else if (signInType === "system") {
                await login(email, "", "", false, true)
              }
            } catch (err) {
              console.error("Backend login after email link failed:", err)
            }
            window.localStorage.removeItem("emailForSignIn")
            window.localStorage.removeItem("emailSignInType")
            toast.success("Signed in successfully via email link")
            router.push("/dashboard")
          })
          .catch((err) => {
            console.error("Error completing email sign-in:", err)
            toast.error("Failed to sign in with email link.")
          })
      }
    } catch (err) {
      console.error("Error checking email sign-in link:", err)
    }
  }, [])

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userLoginOtpSent) {
      toast.error("Please verify your phone number first.")
      return
    }

    if (!userLoginOtp) {
      toast.error("Please enter the OTP.")
      return
    }

    try {
      /* if (isDevelopment()) {
        debugLog("Debug mode: Skipping Firebase OTP confirmation")
        if (userLoginOtp !== DEBUG_OTP) {
          toast.error(`[DEBUG MODE] Invalid OTP. Use: ${DEBUG_OTP}`)
          return
        }
        const backendResult = await login(userLoginData.email, userLoginData.phone_number, userLoginData.countryCode, false)
        if (backendResult?.success) {
          toast.success("Login successful!")
          router.push("/dashboard")
        }
        return
      } */

      const confirmationResult = window.confirmationResult
      const firebaseResult = await confirmationResult.confirm(userLoginOtp)
      let backendResult;
      if (firebaseResult.user) {
        backendResult = await login(userLoginData.email, userLoginData.phone_number, userLoginData.countryCode, false)
      }
      if (backendResult?.success) {
        toast.success("Login successful!")
        router.push("/dashboard")
      }
    } catch (error) {
      // console.error("Error verifying OTP:", error)
      toast.error("Invalid OTP. Please try again.")
    }
  }

  const handleUserRegister = async () => {
    if (isLoading) return

    const emailError = validateEmail(userRegisterData.email)
    const phoneError = validatePhoneNumber(userRegisterData.phone_number)
    const dobError = validateDOB(userRegisterData.date_of_birth)
    const zipError = validateZipCode(userRegisterData.zip_code, userRegisterData.country)
    const idProofError = userRegisterData.id_proof_type === "Aadhar" ? validateAadhar(userRegisterData.id_proof_number) : ""

    setUserRegisterErrors({
      email: emailError,
      phone_number: phoneError,
      date_of_birth: dobError,
      zip_code: zipError,
      id_proof_number: idProofError
    })

    if (!userRegisterData.username || !userRegisterData.email || !userRegisterData.first_name || 
        !userRegisterData.last_name || !userRegisterData.phone_number || !userRegisterData.countryCode) {
      toast.error("Please fill in all required fields")
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(userRegisterData.username)) {
      toast.error("Username can only contain letters, numbers, and underscores")
      return
    }

    if (emailError || phoneError || dobError || zipError || idProofError) {
      toast.error("Please fix the validation errors before submitting")
      return
    }

    setIsLoading(true)
    try {
      const result = await register({
        username: userRegisterData.username,
        email: userRegisterData.email,
        first_name: userRegisterData.first_name,
        last_name: userRegisterData.last_name,
        date_of_birth: userRegisterData.date_of_birth,
        gender: userRegisterData.gender,
        phone_number: userRegisterData.phone_number,
        countryCode: userRegisterData.countryCode,
        address_line1: userRegisterData.address_line1,
        address_line2: userRegisterData.address_line2,
        city: userRegisterData.city,
        state_province: userRegisterData.state_province,
        zip_code: userRegisterData.zip_code,
        country: userRegisterData.country,
        id_proof_type: userRegisterData.id_proof_type,
        id_proof_number: userRegisterData.id_proof_number,
        clubId: userRegisterData.clubId,
        membershipPlanId: userRegisterData.membershipPlanId
      })

      if (result.success) {
        toast.success("Account created successfully!")
        setActiveTab("user-login")
        setUserRegisterData({
          username: "",
          email: "",
          first_name: "",
          last_name: "",
          date_of_birth: "",
          gender: "male" as "male" | "female" | "non-binary",
          phone_number: "",
          countryCode: "+91",
          address_line1: "",
          address_line2: "",
          city: "",
          state_province: "",
          zip_code: "",
          country: "",
          level_name: "",
          id_proof_type: "Aadhar" as "Aadhar" | "Voter ID" | "Passport" | "Driver License",
          id_proof_number: "",
          clubId: "",
          membershipPlanId: ""
        })
        setUserOtpSent(false)
        setUserOtp("")
        setGeneratedOtp("")
      } else {
        if (result.error) {
          if (result.error.includes("username")) {
            toast.error("Username already exists. Please choose a different one.")
          } else if (result.error.includes("email")) {
            toast.error("Email already registered. Please use a different email or login.")
          } else if (result.error.includes("validation")) {
            toast.error("Please check your information and try again.")
          } else {
            toast.error(result.error)
          }
        } else {
          toast.error("Registration failed. Please try again.")
        }
      }
    } catch (error: any) {
      // console.error("Registration error:", error)
      
      if (error.response) {
        const { status, data } = error.response
        
        if (status === 400) {
          if (data?.message) {
            toast.error(data.message)
          } else {
            toast.error("Invalid data provided. Please check your information.")
          }
        } else if (status === 409) {
          if (data?.message?.includes("username")) {
            toast.error("Username already exists. Please choose a different one.")
          } else if (data?.message?.includes("email")) {
            toast.error("Email already registered. Please use a different email or login.")
          } else {
            toast.error("User already exists with this information.")
          }
        } else if (status === 422) {
          if (data?.errors) {
            const errorMessages = Object.values(data.errors).map((err: any) => err.message || err)
            errorMessages.forEach(msg => toast.error(msg))
          } else if (data?.message) {
            toast.error(data.message)
          } else {
            toast.error("Validation failed. Please check your information.")
          }
        } else if (status === 500) {
          if (data?.message && data.message !== "Server error") {
            toast.error(data.message)
          } else {
            toast.error("Server error. Please try again later.")
          }
        } else {
          toast.error(`Registration failed (${status}). Please try again.`)
        }
      } else if (error.request) {
        toast.error("Network error. Please check your connection and try again.")
      } else {
        toast.error("An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!adminLoginOtpSent) {
      toast.error("Please verify your phone number first.")
      return
    }

    if (!adminLoginOtp) {
      toast.error("Please enter the OTP.")
      return
    }

    try {
/*       if (isDevelopment()) {
        debugLog("Debug mode: Skipping Firebase OTP confirmation for admin")
        if (adminLoginOtp !== DEBUG_OTP) {
          toast.error(`[DEBUG MODE] Invalid OTP. Use: ${DEBUG_OTP}`)
          return
        }
        const loginResult = await login(
          adminLoginData.email,
          adminLoginData.phoneNumber,
          adminLoginData.countryCode,
          true
        )
        if (loginResult.success) {
          toast.success("Admin login successful!")
        } else {
          toast.error("Admin login failed. Please try again.")
        }
        return
      }
 */
      const confirmationResult = window.confirmationResult
      const result = await confirmationResult.confirm(adminLoginOtp)

      if (result.user) {
        const loginResult = await login(
          adminLoginData.email,
          adminLoginData.phoneNumber,
          adminLoginData.countryCode,
          true
        )

        if (loginResult.success) {
          toast.success("Admin login successful!")
        } else {
          toast.error("Admin login failed. Please try again.")
        }
      }
    } catch (error) {
      // console.error("Error verifying OTP:", error)
      toast.error("Invalid OTP. Please try again.")
    }
  }

  const handleUserVerifyNumber = async () => {
    if (!userRegisterData.phone_number || !userRegisterData.countryCode) {
      toast.error("Please provide a valid phone number and country code.")
      return
    }

    const phoneNumber = `${userRegisterData.countryCode}${userRegisterData.phone_number}`

/*     if (isDevelopment()) {
      debugLog("Debug mode: Skipping Firebase OTP verification for user registration")
      toast.success(`[DEBUG MODE] OTP sent to ${phoneNumber}. Use code: ${DEBUG_OTP}`)
      setUserOtpSent(true)
      setUserOtp(DEBUG_OTP)
      setUserRegisterResendCountdown(10)
      return
    }
 */
    try {
      const recaptchaVerifier = setupRecaptcha(phoneNumber)
      // console.log("recaptchaVerifier", recaptchaVerifier)
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)

      window.confirmationResult = confirmationResult
      toast.success(`OTP sent to ${phoneNumber}`)
      setUserOtpSent(true)
      setUserRegisterResendCountdown(10)
    } catch (error) {
      // console.error("Error sending OTP:", error)
      toast.error("Failed to send OTP. Please try again.")
    }
  }

  const handleAdminVerifyNumber = async () => {
    if (!adminRegisterData.phone_number || !adminRegisterData.countryCode) {
      toast.error("Please provide a valid phone number and country code.")
      return
    }

    const phoneNumber = `${adminRegisterData.countryCode}${adminRegisterData.phone_number}`

/*     if (isDevelopment()) {
      debugLog("Debug mode: Skipping Firebase OTP verification for admin registration")
      toast.success(`[DEBUG MODE] OTP sent to ${phoneNumber}. Use code: ${DEBUG_OTP}`)
      setAdminOtpSent(true)
      setAdminOtp(DEBUG_OTP)
      setAdminRegisterResendCountdown(10)
      return
    }
 */
    try {
      const recaptchaVerifier = setupRecaptcha(phoneNumber)
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)

      window.confirmationResult = confirmationResult
      toast.success(`OTP sent to ${phoneNumber}`)
      setAdminOtpSent(true)
      setAdminRegisterResendCountdown(10)
    } catch (error) {
      // console.error("Error sending OTP:", error)
      toast.error("Failed to send OTP. Please try again.")
    }
  }

  const handleSystemOwnerVerifyNumber = async () => {
    if (!systemOwnerRegisterData.phone_number || !systemOwnerRegisterData.countryCode) {
      toast.error("Please provide a valid phone number and country code.")
      return
    }

    const phoneNumber = `${systemOwnerRegisterData.countryCode}${systemOwnerRegisterData.phone_number}`

/*     if (isDevelopment()) {
      debugLog("Debug mode: Skipping Firebase OTP verification for system owner registration")
      toast.success(`[DEBUG MODE] OTP sent to ${phoneNumber}. Use code: ${DEBUG_OTP}`)
      setSystemOwnerOtpSent(true)
      setSystemOwnerOtp(DEBUG_OTP)
      setSystemOwnerRegisterResendCountdown(10)
      return
    }
 */
    try {
      const recaptchaVerifier = setupRecaptcha(phoneNumber)
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)

      window.confirmationResult = confirmationResult
      toast.success(`OTP sent to ${phoneNumber}`)
      setSystemOwnerOtpSent(true)
      setSystemOwnerRegisterResendCountdown(10)
    } catch (error) {
      // console.error("Error sending OTP:", error)
      toast.error("Failed to send OTP. Please try again.")
    }
  }

  const handleUserLoginVerifyNumber = async () => {
    if (!userLoginData.phone_number || !userLoginData.countryCode) {
      toast.error("Please provide a valid phone number and country code.")
      return
    }

    const phoneNumber = `${userLoginData.countryCode}${userLoginData.phone_number}`

/*     if (isDevelopment()) {
      debugLog("Debug mode: Skipping Firebase OTP verification")
      toast.success(`[DEBUG MODE] OTP sent to ${phoneNumber}. Use code: ${DEBUG_OTP}`)
      setUserLoginOtpSent(true)
      setUserLoginOtp(DEBUG_OTP)
      setUserLoginResendCountdown(10)
      return
    }
 */
    try {
      const recaptchaVerifier = setupRecaptcha(phoneNumber)
      // console.log("recaptchaVerifier", recaptchaVerifier)
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
      window.confirmationResult = confirmationResult
      toast.success(`OTP sent to ${phoneNumber}`)
      setUserLoginOtpSent(true)
      setUserLoginResendCountdown(10)
    } catch (error) {
      // console.error("Error sending OTP:", error)
      toast.error("Failed to send OTP. Please try again.")
    }
  }

  const handleAdminLoginVerifyNumber = async () => {
    if (!adminLoginData.phoneNumber || !adminLoginData.countryCode) {
      toast.error("Please provide a valid phone number and country code.")
      return
    }

    const phoneNumber = `${adminLoginData.countryCode}${adminLoginData.phoneNumber}`

/*     if (isDevelopment()) {
      debugLog("Debug mode: Skipping Firebase OTP verification for admin")
      toast.success(`[DEBUG MODE] OTP sent to ${phoneNumber}. Use code: ${DEBUG_OTP}`)
      setAdminLoginOtpSent(true)
      setAdminLoginOtp(DEBUG_OTP)
      setAdminLoginResendCountdown(10)
      return
    }
 */
    try {
      const recaptchaVerifier = setupRecaptcha(phoneNumber)
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
      window.confirmationResult = confirmationResult
      toast.success(`OTP sent to ${phoneNumber}`)
      setAdminLoginOtpSent(true)
      setAdminLoginResendCountdown(10)
    } catch (error) {
      // console.error("Error sending OTP:", error)
      toast.error("Failed to send OTP. Please try again.")
    }
  }

  const handleSystemOwnerLoginVerifyNumber = async () => {
    if (!systemOwnerLoginData.phoneNumber || !systemOwnerLoginData.countryCode) {
      toast.error("Please provide a valid phone number and country code.")
      return
    }

    const phoneNumber = `${systemOwnerLoginData.countryCode}${systemOwnerLoginData.phoneNumber}`
    
/*     if (isDevelopment()) {
      debugLog("Debug mode: Skipping Firebase OTP verification for system owner")
      toast.success(`[DEBUG MODE] OTP sent to ${phoneNumber}. Use code: ${DEBUG_OTP}`)
      setSystemOwnerLoginOtpSent(true)
      setSystemOwnerLoginOtp(DEBUG_OTP)
      setSystemOwnerLoginResendCountdown(10)
      return
    }
 */
    try {
      const recaptchaVerifier = setupRecaptcha(phoneNumber)
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
      window.confirmationResult = confirmationResult
      toast.success(`OTP sent to ${phoneNumber}`)
      setSystemOwnerLoginOtpSent(true)
      setSystemOwnerLoginResendCountdown(10)
    } catch (error) {
      // console.error("Error sending OTP:", error)
      toast.error("Failed to send OTP. Please try again.")
    }
  }

  const handleUserLoginResendOTP = () => {
    if (userLoginData.email) {
      toast.success(`OTP resent to ${userLoginData.email}. Code: ${generatedLoginOtp}`)
      setUserLoginResendCountdown(10)
    } else if (userLoginData.phone_number && userLoginData.countryCode) {
      toast.success(`OTP resent to ${userLoginData.countryCode}${userLoginData.phone_number}. Code: ${generatedLoginOtp}`)
      setUserLoginResendCountdown(10)
    }
  }

  const handleAdminLoginResendOTP = () => {
    if (adminLoginData.email) {
      toast.success(`OTP resent to ${adminLoginData.email}. Code: ${generatedLoginOtp}`)
      setAdminLoginResendCountdown(10)
    } else if (adminLoginData.phoneNumber && adminLoginData.countryCode) {
      toast.success(`OTP resent to ${adminLoginData.countryCode}${adminLoginData.phoneNumber}. Code: ${generatedLoginOtp}`)
      setAdminLoginResendCountdown(10)
    }
  }

  const handleSystemOwnerLoginResendOTP = () => {
    if (systemOwnerLoginData.email) {
      toast.success(`OTP resent to ${systemOwnerLoginData.email}. Code: ${generatedLoginOtp}`)
      setSystemOwnerLoginResendCountdown(10)
    } else if (systemOwnerLoginData.phoneNumber && systemOwnerLoginData.countryCode) {
      toast.success(`OTP resent to ${systemOwnerLoginData.countryCode}${systemOwnerLoginData.phoneNumber}. Code: ${generatedLoginOtp}`)
      setSystemOwnerLoginResendCountdown(10)
    }
  }

  const handleUserRegisterResendOTP = () => {
    toast.success(`OTP resent to ${userRegisterData.countryCode}${userRegisterData.phone_number}. Code: ${generatedOtp}`)
    setUserRegisterResendCountdown(10)
  }

  const handleAdminRegisterResendOTP = () => {
    toast.success(`OTP resent to ${adminRegisterData.countryCode}${adminRegisterData.phone_number}. Code: ${generatedOtp}`)
    setAdminRegisterResendCountdown(10)
  }

  const handleSystemOwnerRegisterResendOTP = () => {
    toast.success(`OTP resent to ${systemOwnerRegisterData.countryCode}${systemOwnerRegisterData.phone_number}. Code: ${generatedOtp}`)
    setSystemOwnerRegisterResendCountdown(10)
  }

  const handleAdminRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    /*
    if (!adminOtpSent) {
      toast.error("Please verify your phone number first")
      return
    }

    const expectedOtp = isDevelopment() ? DEBUG_OTP : generatedOtp
    if (adminOtp !== expectedOtp) {
      toast.error(isDevelopment() ? `[DEBUG MODE] Invalid OTP. Use: ${DEBUG_OTP}` : "Invalid OTP. Please check and try again")
      return
    }
    */

    setIsLoading(true)
    
    try {
      const result = await register({
        first_name: adminRegisterData.first_name,
        last_name: adminRegisterData.last_name,
        email: adminRegisterData.email,
        phone_number: adminRegisterData.phone_number,
        countryCode: adminRegisterData.countryCode,
        adminCode: adminRegisterData.adminCode
      }, true)
      
      if (result.success) {
        toast.success("Admin registration successful!")
        router.push("/dashboard")
      } else {
        toast.error(result.error || "Admin registration failed. Please check your admin code.")
      }
    } catch (error) {
      // console.error("Admin registration error:", error)
      toast.error("An error occurred during admin registration.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSystemOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!systemOwnerLoginOtpSent) {
      toast.error("Please verify your phone number first")
      return
    }

    const expectedOtp = isDevelopment() ? DEBUG_OTP : generatedLoginOtp
    if (systemOwnerLoginOtp !== expectedOtp) {
      toast.error(isDevelopment() ? `[DEBUG MODE] Invalid OTP. Use: ${DEBUG_OTP}` : "Invalid OTP. Please check and try again")
      return
    }

    setIsLoading(true)
    
    try {
      const result = await login(systemOwnerLoginData.email, systemOwnerLoginData.phoneNumber, systemOwnerLoginData.countryCode, false, true)
      if (result.success) {
        toast.success("System Owner login successful!")
        router.push("/dashboard")
      } else {
        toast.error(result.error || "System Owner login failed. Please check your credentials.")
      }
    } catch (error) {
      // console.error("System Owner login error:", error)
      toast.error("An error occurred during System Owner login.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSystemOwnerRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    /*
    if (!systemOwnerOtpSent) {
      toast.error("Please verify your phone number first")
      return
    }

    const expectedOtp = isDevelopment() ? DEBUG_OTP : generatedOtp
    if (systemOwnerOtp !== expectedOtp) {
      toast.error(isDevelopment() ? `[DEBUG MODE] Invalid OTP. Use: ${DEBUG_OTP}` : "Invalid OTP. Please check and try again")
      return
    }
    */

    setIsLoading(true)
    
    try {
      const result = await register({
        first_name: systemOwnerRegisterData.first_name,
        last_name: systemOwnerRegisterData.last_name,
        email: systemOwnerRegisterData.email,
        phone_number: systemOwnerRegisterData.phone_number,
        countryCode: systemOwnerRegisterData.countryCode,
        accessKey: systemOwnerRegisterData.accessKey
      }, false, true)
      
      if (result.success) {
        toast.success("System Owner registration successful!")
        router.push("/dashboard")
      } else {
        toast.error(result.error || "System Owner registration failed.")
      }
    } catch (error) {
      // console.error("System Owner registration error:", error)
      toast.error("An error occurred during System Owner registration.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <SiteNavbar brandName="Wingman Pro" />
      <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-0 z-[-2] h-screen w-screen bg-[#000000] bg-[radial-gradient(#ffffff33_1px,#000000_1px)] bg-[size:20px_20px]"></div>
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-8">
          <div className={`w-full ${activeTab.includes('register') ? 'max-w-6xl' : 'max-w-2xl'} transition-all duration-300`}>
            <Card className="backdrop-blur-sm bg-black/20 border-white/20 shadow-2xl">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 relative w-24 h-24">
                <Image
                  src="/WingmanPro Logo (White BG).svg"
                  alt="Wingman Pro logo"
                  fill
                  sizes="96px"
                  className="object-contain"
                  priority
                />
              </div>
              <CardTitle className="text-3xl font-bold text-white">Welcome to Wingman Pro</CardTitle>
              <CardDescription className="text-slate-300 text-lg">
                Manage your supporter group with ease
              </CardDescription>
              <div className="mx-auto mt-4 flex flex-col items-center gap-2 text-xs uppercase tracking-wider text-slate-400">
                <span>Powered by</span>
                <div className="relative h-8 w-40">
                  <Image
                    src="/RallyUpSolutions Logo (Transparent Background).svg"
                    alt="RallyUp Solutions logo"
                    fill
                    sizes="160px"
                    className="object-contain"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-white/10 border-white/20 mb-6">
                  <TabsTrigger value="user-login" className="text-white data-[state=active]:bg-sky-400 data-[state=active]:text-slate-900">User</TabsTrigger>
                  <TabsTrigger value="admin-login" className="text-white data-[state=active]:bg-sky-400 data-[state=active]:text-slate-900">Admin</TabsTrigger>
                  <TabsTrigger value="system-owner-login" className="text-white data-[state=active]:bg-sky-400 data-[state=active]:text-slate-900">System</TabsTrigger>
                </TabsList>
                
                <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                  <TabsContent value="user-login" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="user-email" className="text-white font-medium">Email</Label>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-300 flex-shrink-0" />
                        <Input
                          id="user-email"
                          type="email"
                          placeholder="Enter your email"
                          value={userLoginData.email}
                          onChange={(e) => {
                            const email = e.target.value
                            setUserLoginData({ ...userLoginData, email, phone_number: "", countryCode: "+91" })
                            setUserLoginErrors({ ...userLoginErrors, email: validateEmail(email) })
                          }}
                          onBlur={(e) => {
                            setUserLoginErrors({ ...userLoginErrors, email: validateEmail(e.target.value) })
                          }}
                          className={`bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400 ${userLoginErrors.email ? "border-red-500" : ""}`}
                        />
                      </div>
                      {userLoginErrors.email && (
                        <p className="text-red-400 text-sm">{userLoginErrors.email}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-center">
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex-1 h-px bg-white/30"></div>
                        <div className="text-white text-sm font-medium px-3">OR</div>
                        <div className="flex-1 h-px bg-white/30"></div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="user-login-country-code" className="text-white font-medium">Country Code</Label>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-300 flex-shrink-0" />
                          <Input
                            id="user-login-country-code"
                            type="text"
                            placeholder="+91"
                            value={userLoginData.countryCode}
                            onChange={(e) => setUserLoginData({ ...userLoginData, countryCode: e.target.value })}
                            disabled={!!userLoginData.email}
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-sky-400"
                          />
                        </div>
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="user-login-phone" className="text-white font-medium">Phone Number</Label>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-300 flex-shrink-0" />
                          <Input
                            id="user-login-phone"
                            type="tel"
                            placeholder="Enter your phone number"
                            value={userLoginData.phone_number}
                            onChange={(e) => {
                              const phone = e.target.value.replace(/\D/g, "")
                              setUserLoginData({ ...userLoginData, phone_number: phone, email: "" })
                              setUserLoginErrors({ ...userLoginErrors, phone_number: validatePhoneNumber(phone) })
                            }}
                            onBlur={(e) => {
                              setUserLoginErrors({ ...userLoginErrors, phone_number: validatePhoneNumber(e.target.value) })
                            }}
                            disabled={!!userLoginData.email}
                            className={`bg-white/10 border-white/20 text-white placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-sky-400 ${userLoginErrors.phone_number ? "border-red-500" : ""}`}
                          />
                        </div>
                        {userLoginErrors.phone_number && (
                          <p className="text-red-400 text-sm">{userLoginErrors.phone_number}</p>
                        )}
                      </div>
                    </div>
                    
                    {!userLoginOtpSent ? (
                      <Button 
                        onClick={() => {
                          ;(async () => {
                            if (userLoginData.email) {
                              const emailError = validateEmail(userLoginData.email)
                              setUserLoginErrors({ ...userLoginErrors, email: emailError })
                              if (emailError) {
                                toast.error("Please fix the email validation error")
                                return
                              }
                              const actionCodeSettings = {
                                url: window.location.origin + "/login",
                                handleCodeInApp: true,
                              }
                              try {
                                setOtpButtonLoading(true)
                                await sendSignInLinkToEmail(auth, userLoginData.email, actionCodeSettings)
                                window.localStorage.setItem("emailForSignIn", userLoginData.email)
                                window.localStorage.setItem("emailSignInType", "user")
                                toast.success(`Sign-in link sent to ${userLoginData.email}. Check your email to complete sign-in.`)
                                setUserLoginOtpSent(true)
                                setOtpButtonLoading(false)
                                setUserLoginResendCountdown(10)
                              } catch (err) {
                                console.error("Error sending email sign-in link:", err)
                                toast.error("Failed to send sign-in link. Please try again.")
                              }
                            } else if (userLoginData.phone_number && userLoginData.countryCode) {
                              const phoneError = validatePhoneNumber(userLoginData.phone_number)
                              setUserLoginErrors({ ...userLoginErrors, phone_number: phoneError })
                              if (phoneError) {
                                toast.error("Please fix the phone number validation error")
                                return
                              }
                              setOtpButtonLoading(true)
                              await handleUserLoginVerifyNumber()
                              setOtpButtonLoading(false)
                            } else {
                              toast.error("Please enter either email or phone number")
                            }
                          })()
                        }}
                        disabled={!userLoginData.email && (!userLoginData.phone_number || !userLoginData.countryCode) || (userLoginData.email && userLoginErrors.email) || (userLoginData.phone_number && userLoginErrors.phone_number) || otpButtonLoading}
                        className="w-full bg-sky-400 text-slate-900 hover:bg-sky-300 h-12 text-lg font-medium"
                      >
                        {!otpButtonLoading ? "Send OTP" : "Sending OTP"}
                        <Phone className="ml-2 w-4 h-4" />
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        {userLoginData.email ? (
                          <div className="space-y-3">
                            <p className="text-slate-300">A sign-in link has been sent to <strong className="text-white">{userLoginData.email}</strong>. Open the link in your email to complete sign-in. If you opened the link in another device, return to this browser to complete the flow.</p>
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => {
                                  ;(async () => {
                                    const actionCodeSettings = { url: window.location.origin + "/login", handleCodeInApp: true }
                                    try {
                                      await sendSignInLinkToEmail(auth, userLoginData.email, actionCodeSettings)
                                      window.localStorage.setItem("emailForSignIn", userLoginData.email)
                                      window.localStorage.setItem("emailSignInType", "user")
                                      toast.success(`Sign-in link resent to ${userLoginData.email}.`)
                                      setUserLoginResendCountdown(10)
                                    } catch (err) {
                                      console.error("Error resending email sign-in link:", err)
                                      toast.error("Failed to resend sign-in link. Please try again.")
                                    }
                                  })()
                                }}
                                className="flex-1 bg-sky-400 text-slate-900 hover:bg-sky-300 h-12 text-lg font-medium"
                              >
                                Resend Link
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setUserLoginOtpSent(false)
                                }}
                                className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 h-12 px-4"
                              >
                                Use Phone Instead
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="user-login-otp" className="text-white font-medium">OTP Code</Label>
                              <Input
                                id="user-login-otp"
                                type="text"
                                placeholder="Enter 6-digit OTP"
                                value={userLoginOtp}
                                onChange={(e) => setUserLoginOtp(e.target.value)}
                                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400 h-12 text-center text-lg"
                                maxLength={6}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Button onClick={handleUserLogin} className="flex-1 bg-sky-400 text-slate-900 hover:bg-sky-300 h-12 text-lg font-medium" disabled={isLoading}>
                                {isLoading ? "Signing in..." : "Sign In"}
                                <LogIn className="ml-2 w-4 h-4" />
                              </Button>
                              <Button 
                                type="button"
                                variant="outline"
                                onClick={handleUserLoginResendOTP}
                                disabled={userLoginResendCountdown > 0}
                                className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 h-12 px-4"
                              >
                                {userLoginResendCountdown > 0 ? `Resend (${userLoginResendCountdown}s)` : "Resend"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="space-y-3 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab("user-register")} 
                        className="w-full border-slate-700 bg-slate-800 text-white hover:bg-slate-700 h-11"
                      >
                        Create Account
                        <UserPlus className="ml-2 w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => router.push("/clubs")} 
                        className="w-full border-slate-700 bg-slate-800 text-white hover:bg-slate-700 h-11"
                      >
                        Browse Clubs
                        <Building2 className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="user-register" className="space-y-4 mt-4">
                    <div className="flex flex-col lg:flex-row gap-8">
                      {/* Left Column */}
                      <div className="flex-1 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="user-username" className="text-white font-medium">Username</Label>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-300 flex-shrink-0" />
                            <Input
                              id="user-username"
                              type="text"
                              placeholder="Enter your username"
                              value={userRegisterData.username}
                              onChange={(e) => setUserRegisterData({ ...userRegisterData, username: e.target.value })}
                              className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400"
                            />
                          </div>
                          <p className="text-xs text-slate-400">
                            Username can only contain letters, numbers, and underscores (e.g., john_doe123)
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="user-first-name" className="text-white font-medium">First Name</Label>
                            <Input
                              id="user-first-name"
                              type="text"
                              placeholder="Enter your first name"
                              value={userRegisterData.first_name}
                              onChange={(e) => setUserRegisterData({ ...userRegisterData, first_name: e.target.value })}
                              className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="user-last-name" className="text-white font-medium">Last Name</Label>
                            <Input
                              id="user-last-name"
                              type="text"
                              placeholder="Enter your last name"
                              value={userRegisterData.last_name}
                              onChange={(e) => setUserRegisterData({ ...userRegisterData, last_name: e.target.value })}
                              className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="user-register-email" className="text-white font-medium">Email</Label>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-slate-300 flex-shrink-0" />
                            <Input
                              id="user-register-email"
                              type="email"
                              placeholder="Enter your email"
                              value={userRegisterData.email}
                              onChange={(e) => {
                                const email = e.target.value
                                setUserRegisterData({ ...userRegisterData, email })
                                setUserRegisterErrors({ ...userRegisterErrors, email: validateEmail(email) })
                              }}
                              onBlur={(e) => {
                                setUserRegisterErrors({ ...userRegisterErrors, email: validateEmail(e.target.value) })
                              }}
                              className={`bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400 ${userRegisterErrors.email ? "border-red-500" : ""}`}
                            />
                          </div>
                          {userRegisterErrors.email && (
                            <p className="text-red-400 text-sm">{userRegisterErrors.email}</p>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-2">
                            <Label htmlFor="user-country-code" className="text-white font-medium">Country Code</Label>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-slate-300 flex-shrink-0" />
                              <Input
                                id="user-country-code"
                                type="text"
                                placeholder="+91"
                                value={userRegisterData.countryCode}
                                onChange={(e) => setUserRegisterData({ ...userRegisterData, countryCode: e.target.value })}
                                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400"
                              />
                            </div>
                          </div>
                          <div className="col-span-2 space-y-2">
                            <Label htmlFor="user-phone" className="text-white font-medium">Phone Number</Label>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-slate-300 flex-shrink-0" />
                              <Input
                                id="user-phone"
                                type="tel"
                                placeholder="Enter your phone number"
                                value={userRegisterData.phone_number}
                                onChange={(e) => {
                                  const phone = e.target.value.replace(/\D/g, "")
                                  setUserRegisterData({ ...userRegisterData, phone_number: phone })
                                  setUserRegisterErrors({ ...userRegisterErrors, phone_number: validatePhoneNumber(phone) })
                                }}
                                onBlur={(e) => {
                                  setUserRegisterErrors({ ...userRegisterErrors, phone_number: validatePhoneNumber(e.target.value) })
                                }}
                                className={`bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400 ${userRegisterErrors.phone_number ? "border-red-500" : ""}`}
                              />
                            </div>
                            {userRegisterErrors.phone_number && (
                              <p className="text-red-400 text-sm">{userRegisterErrors.phone_number}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="user-date-of-birth" className="text-white font-medium">Date of Birth</Label>
                            <Input
                              id="user-date-of-birth"
                              type="date"
                              value={userRegisterData.date_of_birth}
                              onChange={(e) => {
                                const dob = e.target.value
                                setUserRegisterData({ ...userRegisterData, date_of_birth: dob })
                                setUserRegisterErrors({ ...userRegisterErrors, date_of_birth: validateDOB(dob) })
                              }}
                              onBlur={(e) => {
                                setUserRegisterErrors({ ...userRegisterErrors, date_of_birth: validateDOB(e.target.value) })
                              }}
                              max={new Date().toISOString().split('T')[0]}
                              className={`bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400 ${userRegisterErrors.date_of_birth ? "border-red-500" : ""}`}
                            />
                            {userRegisterErrors.date_of_birth && (
                              <p className="text-red-400 text-sm">{userRegisterErrors.date_of_birth}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="user-gender" className="text-white font-medium">Gender</Label>
                            <select
                              id="user-gender"
                              value={userRegisterData.gender}
                              onChange={(e) => setUserRegisterData({ ...userRegisterData, gender: e.target.value as "male" | "female" | "non-binary" })}
                              className="w-full bg-white/10 border border-white/20 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:outline-none"
                            >
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="non-binary">Non-binary</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="flex-1 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="user-address-line1" className="text-white font-medium">Address Line 1</Label>
                          <Input
                            id="user-address-line1"
                            type="text"
                            placeholder="Enter your address"
                            value={userRegisterData.address_line1}
                            onChange={(e) => setUserRegisterData({ ...userRegisterData, address_line1: e.target.value })}
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="user-address-line2" className="text-white font-medium">Address Line 2 (Optional)</Label>
                          <Input
                            id="user-address-line2"
                            type="text"
                            placeholder="Apartment, suite, etc."
                            value={userRegisterData.address_line2}
                            onChange={(e) => setUserRegisterData({ ...userRegisterData, address_line2: e.target.value })}
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="user-city" className="text-white font-medium">City</Label>
                            <Input
                              id="user-city"
                              type="text"
                              placeholder="Enter city"
                              value={userRegisterData.city}
                              onChange={(e) => setUserRegisterData({ ...userRegisterData, city: e.target.value })}
                              className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="user-state" className="text-white font-medium">State/Province</Label>
                            <Input
                              id="user-state"
                              type="text"
                              placeholder="Enter state"
                              value={userRegisterData.state_province}
                              onChange={(e) => setUserRegisterData({ ...userRegisterData, state_province: e.target.value })}
                              className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="user-zip" className="text-white font-medium">ZIP Code</Label>
                            <Input
                              id="user-zip"
                              type="text"
                              placeholder="Enter ZIP code"
                              value={userRegisterData.zip_code}
                              onChange={(e) => {
                                const zipCode = e.target.value
                                setUserRegisterData({ ...userRegisterData, zip_code: zipCode })
                                setUserRegisterErrors({ ...userRegisterErrors, zip_code: validateZipCode(zipCode, userRegisterData.country) })
                              }}
                              onBlur={(e) => {
                                setUserRegisterErrors({ ...userRegisterErrors, zip_code: validateZipCode(e.target.value, userRegisterData.country) })
                              }}
                              className={`bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400 ${userRegisterErrors.zip_code ? "border-red-500" : ""}`}
                            />
                            {userRegisterErrors.zip_code && (
                              <p className="text-red-400 text-sm">{userRegisterErrors.zip_code}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="user-country" className="text-white font-medium">Country</Label>
                          <select
                            id="user-country"
                            value={userRegisterData.country}
                            onChange={(e) => {
                              const country = e.target.value
                              setUserRegisterData({ ...userRegisterData, country })
                              if (userRegisterData.zip_code) {
                                setUserRegisterErrors({ ...userRegisterErrors, zip_code: validateZipCode(userRegisterData.zip_code, country) })
                              }
                            }}
                            className="w-full bg-white/10 border border-white/20 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:outline-none"
                          >
                            <option value="">Select your country</option>
                            <option value="India">India</option>
                            <option value="United States">United States</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="Canada">Canada</option>
                            <option value="Australia">Australia</option>
                            <option value="Germany">Germany</option>
                            <option value="France">France</option>
                            <option value="Japan">Japan</option>
                            <option value="China">China</option>
                            <option value="Brazil">Brazil</option>
                            <option value="Mexico">Mexico</option>
                            <option value="South Africa">South Africa</option>
                            <option value="Nigeria">Nigeria</option>
                            <option value="Kenya">Kenya</option>
                            <option value="Egypt">Egypt</option>
                            <option value="Saudi Arabia">Saudi Arabia</option>
                            <option value="UAE">UAE</option>
                            <option value="Singapore">Singapore</option>
                            <option value="Malaysia">Malaysia</option>
                            <option value="Thailand">Thailand</option>
                            <option value="Vietnam">Vietnam</option>
                            <option value="Philippines">Philippines</option>
                            <option value="Indonesia">Indonesia</option>
                            <option value="Pakistan">Pakistan</option>
                            <option value="Bangladesh">Bangladesh</option>
                            <option value="Sri Lanka">Sri Lanka</option>
                            <option value="Nepal">Nepal</option>
                            <option value="Bhutan">Bhutan</option>
                            <option value="Myanmar">Myanmar</option>
                            <option value="Cambodia">Cambodia</option>
                            <option value="Laos">Laos</option>
                            <option value="Mongolia">Mongolia</option>
                            <option value="Kazakhstan">Kazakhstan</option>
                            <option value="Uzbekistan">Uzbekistan</option>
                            <option value="Kyrgyzstan">Kyrgyzstan</option>
                            <option value="Tajikistan">Tajikistan</option>
                            <option value="Turkmenistan">Turkmenistan</option>
                            <option value="Afghanistan">Afghanistan</option>
                            <option value="Iran">Iran</option>
                            <option value="Iraq">Iraq</option>
                            <option value="Syria">Syria</option>
                            <option value="Lebanon">Lebanon</option>
                            <option value="Jordan">Jordan</option>
                            <option value="Israel">Israel</option>
                            <option value="Palestine">Palestine</option>
                            <option value="Turkey">Turkey</option>
                            <option value="Greece">Greece</option>
                            <option value="Italy">Italy</option>
                            <option value="Spain">Spain</option>
                            <option value="Portugal">Portugal</option>
                            <option value="Netherlands">Netherlands</option>
                            <option value="Belgium">Belgium</option>
                            <option value="Switzerland">Switzerland</option>
                            <option value="Austria">Austria</option>
                            <option value="Poland">Poland</option>
                            <option value="Czech Republic">Czech Republic</option>
                            <option value="Slovakia">Slovakia</option>
                            <option value="Hungary">Hungary</option>
                            <option value="Romania">Romania</option>
                            <option value="Bulgaria">Bulgaria</option>
                            <option value="Croatia">Croatia</option>
                            <option value="Slovenia">Slovenia</option>
                            <option value="Serbia">Serbia</option>
                            <option value="Bosnia and Herzegovina">Bosnia and Herzegovina</option>
                            <option value="Montenegro">Montenegro</option>
                            <option value="Albania">Albania</option>
                            <option value="North Macedonia">North Macedonia</option>
                            <option value="Kosovo">Kosovo</option>
                            <option value="Moldova">Moldova</option>
                            <option value="Ukraine">Ukraine</option>
                            <option value="Belarus">Belarus</option>
                            <option value="Lithuania">Lithuania</option>
                            <option value="Latvia">Latvia</option>
                            <option value="Estonia">Estonia</option>
                            <option value="Finland">Finland</option>
                            <option value="Sweden">Sweden</option>
                            <option value="Norway">Norway</option>
                            <option value="Denmark">Denmark</option>
                            <option value="Iceland">Iceland</option>
                            <option value="Ireland">Ireland</option>
                            <option value="New Zealand">New Zealand</option>
                            <option value="Argentina">Argentina</option>
                            <option value="Chile">Chile</option>
                            <option value="Peru">Peru</option>
                            <option value="Colombia">Colombia</option>
                            <option value="Venezuela">Venezuela</option>
                            <option value="Ecuador">Ecuador</option>
                            <option value="Bolivia">Bolivia</option>
                            <option value="Paraguay">Paraguay</option>
                            <option value="Uruguay">Uruguay</option>
                            <option value="Guyana">Guyana</option>
                            <option value="Suriname">Suriname</option>
                            <option value="French Guiana">French Guiana</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="user-id-proof-type" className="text-white font-medium">ID Proof Type</Label>
                            <select
                              id="user-id-proof-type"
                              value={userRegisterData.id_proof_type}
                              onChange={(e) => {
                                const idType = e.target.value as "Aadhar" | "Voter ID" | "Passport" | "Driver License"
                                setUserRegisterData({ ...userRegisterData, id_proof_type: idType, id_proof_number: "" })
                                setUserRegisterErrors({ ...userRegisterErrors, id_proof_number: "" })
                              }}
                              className="w-full bg-white/10 border border-white/20 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:outline-none"
                            >
                              <option value="Aadhar">Aadhar</option>
                              <option value="Voter ID">Voter ID</option>
                              <option value="Passport">Passport</option>
                              <option value="Driver License">Driver License</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="user-id-proof-number" className="text-white font-medium">ID Proof Number</Label>
                            <Input
                              id="user-id-proof-number"
                              type="text"
                              placeholder={userRegisterData.id_proof_type === "Aadhar" ? "Enter 12-digit Aadhar number" : "Enter ID number"}
                              value={userRegisterData.id_proof_number}
                              onChange={(e) => {
                                let idNumber = e.target.value
                                if (userRegisterData.id_proof_type === "Aadhar") {
                                  idNumber = idNumber.replace(/\D/g, "")
                                }
                                setUserRegisterData({ ...userRegisterData, id_proof_number: idNumber })
                                if (userRegisterData.id_proof_type === "Aadhar") {
                                  setUserRegisterErrors({ ...userRegisterErrors, id_proof_number: validateAadhar(idNumber) })
                                } else {
                                  setUserRegisterErrors({ ...userRegisterErrors, id_proof_number: "" })
                                }
                              }}
                              onBlur={(e) => {
                                if (userRegisterData.id_proof_type === "Aadhar") {
                                  setUserRegisterErrors({ ...userRegisterErrors, id_proof_number: validateAadhar(e.target.value) })
                                }
                              }}
                              maxLength={userRegisterData.id_proof_type === "Aadhar" ? 12 : undefined}
                              className={`bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400 ${userRegisterErrors.id_proof_number ? "border-red-500" : ""}`}
                            />
                            {userRegisterErrors.id_proof_number && (
                              <p className="text-red-400 text-sm">{userRegisterErrors.id_proof_number}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Section - Full Width */}
                    <div className="pt-6 space-y-4">
                      {/*
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleUserVerifyNumber}
                          disabled={userOtpSent || !userRegisterData.phone_number || !userRegisterData.countryCode}
                          className="flex-1 border-slate-700 bg-slate-800 text-white hover:bg-slate-700 h-11"
                        >
                          {userOtpSent ? "OTP Sent ✓" : "Verify Number"}
                        </Button>
                      </div>
                      */}
                      
                      {userOtpSent && (
                        <div className="space-y-2">
                          <Label htmlFor="user-otp" className="text-white font-medium">Enter OTP</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id="user-otp"
                              type="password"
                              placeholder="Enter 6-digit OTP"
                              value={userOtp}
                              onChange={(e) => setUserOtp(e.target.value)}
                              maxLength={6}
                              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400 h-12 text-center text-lg"
                            />
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={handleUserRegisterResendOTP}
                              disabled={userRegisterResendCountdown > 0}
                              size="sm"
                              className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 h-12 px-4"
                            >
                              {userRegisterResendCountdown > 0 ? `Resend (${userRegisterResendCountdown}s)` : "Resend"}
                            </Button>
                          </div>
                        </div>
                      )}

                      <Button onClick={handleUserRegister} className="w-full bg-sky-400 text-slate-900 hover:bg-sky-300 h-12 text-lg font-medium" disabled={isLoading}>
                        {isLoading ? "Creating account..." : "Create Account"}
                        <UserPlus className="ml-2 w-4 h-4" />
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab("user-login")} 
                        className="w-full border-slate-700 bg-slate-800 text-white hover:bg-slate-700 h-11"
                      >
                        Back to Login
                        <LogIn className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="admin-login" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-email" className="text-white font-medium">Admin Email</Label>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-300 flex-shrink-0" />
                        <Input
                          id="admin-email"
                          type="email"
                          placeholder="Enter admin email"
                          value={adminLoginData.email}
                          onChange={(e) => {
                            const email = e.target.value
                            setAdminLoginData({ ...adminLoginData, email, phoneNumber: "", countryCode: "+91" })
                            setAdminLoginErrors({ ...adminLoginErrors, email: validateEmail(email) })
                          }}
                          onBlur={(e) => {
                            setAdminLoginErrors({ ...adminLoginErrors, email: validateEmail(e.target.value) })
                          }}
                          className={`bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400 ${adminLoginErrors.email ? "border-red-500" : ""}`}
                        />
                      </div>
                      {adminLoginErrors.email && (
                        <p className="text-red-400 text-sm">{adminLoginErrors.email}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-center">
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex-1 h-px bg-white/30"></div>
                        <div className="text-white text-sm font-medium px-3">OR</div>
                        <div className="flex-1 h-px bg-white/30"></div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="admin-login-country-code" className="text-white font-medium">Country Code</Label>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-300 flex-shrink-0" />
                          <Input
                            id="admin-login-country-code"
                            type="text"
                            placeholder="+91"
                            value={adminLoginData.countryCode}
                            onChange={(e) => setAdminLoginData({ ...adminLoginData, countryCode: e.target.value })}
                            disabled={!!adminLoginData.email}
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-sky-400"
                          />
                        </div>
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="admin-login-phone" className="text-white font-medium">Phone Number</Label>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-300 flex-shrink-0" />
                          <Input
                            id="admin-login-phone"
                            type="tel"
                            placeholder="Enter admin phone number"
                            value={adminLoginData.phoneNumber}
                            onChange={(e) => {
                              const phone = e.target.value.replace(/\D/g, "")
                              setAdminLoginData({ ...adminLoginData, phoneNumber: phone, email: "" })
                              setAdminLoginErrors({ ...adminLoginErrors, phoneNumber: validatePhoneNumber(phone) })
                            }}
                            onBlur={(e) => {
                              setAdminLoginErrors({ ...adminLoginErrors, phoneNumber: validatePhoneNumber(e.target.value) })
                            }}
                            disabled={!!adminLoginData.email}
                            className={`bg-white/10 border-white/20 text-white placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-sky-400 ${adminLoginErrors.phoneNumber ? "border-red-500" : ""}`}
                          />
                        </div>
                        {adminLoginErrors.phoneNumber && (
                          <p className="text-red-400 text-sm">{adminLoginErrors.phoneNumber}</p>
                        )}
                      </div>
                    </div>
                    
                    {!adminLoginOtpSent ? (
                      <Button 
                        onClick={() => {
                          ;(async () => {
                            if (adminLoginData.email) {
                              const actionCodeSettings = {
                                url: window.location.origin + "/login",
                                handleCodeInApp: true,
                              }
                              try {
                                setOtpButtonLoading(true)
                                await sendSignInLinkToEmail(auth, adminLoginData.email, actionCodeSettings)
                                window.localStorage.setItem("emailForSignIn", adminLoginData.email)
                                window.localStorage.setItem("emailSignInType", "admin")
                                toast.success(`Sign-in link sent to ${adminLoginData.email}. Check your email to complete sign-in.`)
                                setOtpButtonLoading(false)
                                setAdminLoginOtpSent(true)
                                setAdminLoginResendCountdown(10)
                              } catch (err) {
                                console.error("Error sending email sign-in link:", err)
                                toast.error("Failed to send sign-in link. Please try again.")
                              }
                            } else if (adminLoginData.phoneNumber && adminLoginData.countryCode) {
                              setOtpButtonLoading(true)
                              await handleAdminLoginVerifyNumber()
                              setOtpButtonLoading(false)
                            } else {
                              toast.error("Please enter either email or phone number")
                            }
                          })()
                        }}
                        disabled={!adminLoginData.email && (!adminLoginData.phoneNumber || !adminLoginData.countryCode) || otpButtonLoading}
                        className="w-full bg-sky-400 text-slate-900 hover:bg-sky-300 h-12 text-lg font-medium"
                      >
                        {!otpButtonLoading ? "Send OTP" : "Sending OTP"}
                        <Phone className="ml-2 w-4 h-4" />
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        {adminLoginData.email ? (
                          <div className="space-y-3">
                            <p className="text-slate-300">A sign-in link has been sent to <strong className="text-white">{adminLoginData.email}</strong>. Open the link in your email to complete sign-in.</p>
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => {
                                  ;(async () => {
                                    const actionCodeSettings = { url: window.location.origin + "/login", handleCodeInApp: true }
                                    try {
                                      await sendSignInLinkToEmail(auth, adminLoginData.email, actionCodeSettings)
                                      window.localStorage.setItem("emailForSignIn", adminLoginData.email)
                                      window.localStorage.setItem("emailSignInType", "admin")
                                      toast.success(`Sign-in link resent to ${adminLoginData.email}.`)
                                      setAdminLoginResendCountdown(10)
                                    } catch (err) {
                                      console.error("Error resending email sign-in link:", err)
                                      toast.error("Failed to resend sign-in link. Please try again.")
                                    }
                                  })()
                                }}
                                className="flex-1 bg-sky-400 text-slate-900 hover:bg-sky-300 h-12 text-lg font-medium"
                              >
                                Resend Link
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setAdminLoginOtpSent(false)}
                                className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 h-12 px-4"
                              >
                                Use Phone Instead
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="admin-login-otp" className="text-white font-medium">OTP Code</Label>
                              <Input
                                id="admin-login-otp"
                                type="text"
                                placeholder="Enter 6-digit OTP"
                                value={adminLoginOtp}
                                onChange={(e) => setAdminLoginOtp(e.target.value)}
                                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400 h-12 text-center text-lg"
                                maxLength={6}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Button onClick={handleAdminLogin} className="flex-1 bg-sky-400 text-slate-900 hover:bg-sky-300 h-12 text-lg font-medium" disabled={isLoading}>
                                {isLoading ? "Signing in..." : "Admin Sign In"}
                                <Shield className="ml-2 h-4 w-4" />
                              </Button>
                              <Button 
                                type="button"
                                variant="outline"
                                onClick={handleAdminLoginResendOTP}
                                disabled={adminLoginResendCountdown > 0}
                                className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 h-12 px-4"
                              >
                                {adminLoginResendCountdown > 0 ? `Resend (${adminLoginResendCountdown}s)` : "Resend"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab("admin-register")} 
                      className="w-full border-slate-700 bg-slate-800 text-white hover:bg-slate-700 h-11"
                    >
                      Create Admin Account
                      <UserPlus className="ml-2 w-4 h-4" />
                    </Button>
                  </TabsContent>

                  <TabsContent value="admin-register" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="admin-first-name" className="text-white font-medium">First Name</Label>
                        <Input
                          id="admin-first-name"
                          type="text"
                          placeholder="Enter first name"
                          value={adminRegisterData.first_name}
                          onChange={(e) => setAdminRegisterData({ ...adminRegisterData, first_name: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-last-name" className="text-white font-medium">Last Name</Label>
                        <Input
                          id="admin-last-name"
                          type="text"
                          placeholder="Enter last name"
                          value={adminRegisterData.last_name}
                          onChange={(e) => setAdminRegisterData({ ...adminRegisterData, last_name: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="admin-register-email" className="text-white font-medium">Admin Email</Label>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-300 flex-shrink-0" />
                        <Input
                          id="admin-register-email"
                          type="email"
                          placeholder="Enter admin email"
                          value={adminRegisterData.email}
                          onChange={(e) => {
                            const email = e.target.value
                            setAdminRegisterData({ ...adminRegisterData, email })
                            setAdminRegisterErrors({ ...adminRegisterErrors, email: validateEmail(email) })
                          }}
                          onBlur={(e) => {
                            setAdminRegisterErrors({ ...adminRegisterErrors, email: validateEmail(e.target.value) })
                          }}
                          className={`bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400 ${adminRegisterErrors.email ? "border-red-500" : ""}`}
                        />
                      </div>
                      {adminRegisterErrors.email && (
                        <p className="text-red-400 text-sm">{adminRegisterErrors.email}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="admin-country-code" className="text-white font-medium">Country Code</Label>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-300 flex-shrink-0" />
                          <Input
                            id="admin-country-code"
                            type="text"
                            placeholder="+91"
                            value={adminRegisterData.countryCode}
                            onChange={(e) => setAdminRegisterData({ ...adminRegisterData, countryCode: e.target.value })}
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400"
                          />
                        </div>
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="admin-phone" className="text-white font-medium">Phone Number</Label>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-300 flex-shrink-0" />
                          <Input
                            id="admin-phone"
                            type="tel"
                            placeholder="Enter phone number"
                            value={adminRegisterData.phone_number}
                            onChange={(e) => {
                              const phone = e.target.value.replace(/\D/g, "")
                              setAdminRegisterData({ ...adminRegisterData, phone_number: phone })
                              setAdminRegisterErrors({ ...adminRegisterErrors, phone_number: validatePhoneNumber(phone) })
                            }}
                            onBlur={(e) => {
                              setAdminRegisterErrors({ ...adminRegisterErrors, phone_number: validatePhoneNumber(e.target.value) })
                            }}
                            className={`bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400 ${adminRegisterErrors.phone_number ? "border-red-500" : ""}`}
                          />
                        </div>
                        {adminRegisterErrors.phone_number && (
                          <p className="text-red-400 text-sm">{adminRegisterErrors.phone_number}</p>
                        )}
                      </div>
                    </div>
                    
                    {/*
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleAdminVerifyNumber}
                        disabled={adminOtpSent || !adminRegisterData.phone_number || !adminRegisterData.countryCode}
                        className="flex-1 border-slate-700 bg-slate-800 text-white hover:bg-slate-700 h-11"
                      >
                        {adminOtpSent ? "OTP Sent ✓" : "Verify Number"}
                      </Button>
                    </div>
                    */}
                    
                    {adminOtpSent && (
                      <div className="space-y-2">
                        <Label htmlFor="admin-otp" className="text-white font-medium">Enter OTP</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="admin-otp"
                            type="password"
                            placeholder="Enter 6-digit OTP"
                            value={adminOtp}
                            onChange={(e) => setAdminOtp(e.target.value)}
                            maxLength={6}
                            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400 h-12 text-center text-lg"
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleAdminRegisterResendOTP}
                            disabled={adminRegisterResendCountdown > 0}
                            size="sm"
                            className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 h-12 px-4"
                          >
                            {adminRegisterResendCountdown > 0 ? `Resend (${adminRegisterResendCountdown}s)` : "Resend"}
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="admin-code" className="text-white font-medium">Admin Code</Label>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-slate-300 flex-shrink-0" />
                        <Input
                          id="admin-code"
                          type="text"
                          placeholder="Enter admin registration code"
                          value={adminRegisterData.adminCode}
                          onChange={(e) => setAdminRegisterData({ ...adminRegisterData, adminCode: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400"
                        />
                      </div>
                    </div>

                    <Button onClick={handleAdminRegister} className="w-full bg-sky-400 text-slate-900 hover:bg-sky-300 h-12 text-lg font-medium" disabled={isLoading}>
                      {isLoading ? "Creating admin account..." : "Create Admin Account"}
                      <Shield className="ml-2 w-4 h-4" />
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab("admin-login")} 
                      className="w-full border-slate-700 bg-slate-800 text-white hover:bg-slate-700 h-11"
                    >
                      Back to Admin Login
                      <LogIn className="ml-2 w-4 h-4" />
                    </Button>
                  </TabsContent>

                  <TabsContent value="system-owner-login" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="system-owner-email" className="text-white font-medium">Email</Label>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-300 flex-shrink-0" />
                        <Input
                          id="system-owner-email"
                          type="email"
                          placeholder="Enter your email"
                          value={systemOwnerLoginData.email}
                          onChange={(e) => {
                            const email = e.target.value
                            setSystemOwnerLoginData({ ...systemOwnerLoginData, email, phoneNumber: "", countryCode: "+91" })
                            setSystemOwnerLoginErrors({ ...systemOwnerLoginErrors, email: validateEmail(email) })
                          }}
                          onBlur={(e) => {
                            setSystemOwnerLoginErrors({ ...systemOwnerLoginErrors, email: validateEmail(e.target.value) })
                          }}
                          className={`bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400 ${systemOwnerLoginErrors.email ? "border-red-500" : ""}`}
                        />
                      </div>
                      {systemOwnerLoginErrors.email && (
                        <p className="text-red-400 text-sm">{systemOwnerLoginErrors.email}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-center">
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex-1 h-px bg-white/30"></div>
                        <div className="text-white text-sm font-medium px-3">OR</div>
                        <div className="flex-1 h-px bg-white/30"></div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="system-owner-login-country-code" className="text-white font-medium">Country Code</Label>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-300 flex-shrink-0" />
                          <Input
                            id="system-owner-login-country-code"
                            type="text"
                            placeholder="+91"
                            value={systemOwnerLoginData.countryCode}
                            onChange={(e) => setSystemOwnerLoginData({ ...systemOwnerLoginData, countryCode: e.target.value })}
                            disabled={!!systemOwnerLoginData.email}
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-sky-400"
                          />
                        </div>
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="system-owner-login-phone" className="text-white font-medium">Phone Number</Label>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-300 flex-shrink-0" />
                          <Input
                            id="system-owner-login-phone"
                            type="tel"
                            placeholder="Enter your phone number"
                            value={systemOwnerLoginData.phoneNumber}
                            onChange={(e) => {
                              const phone = e.target.value.replace(/\D/g, "")
                              setSystemOwnerLoginData({ ...systemOwnerLoginData, phoneNumber: phone, email: "" })
                              setSystemOwnerLoginErrors({ ...systemOwnerLoginErrors, phoneNumber: validatePhoneNumber(phone) })
                            }}
                            onBlur={(e) => {
                              setSystemOwnerLoginErrors({ ...systemOwnerLoginErrors, phoneNumber: validatePhoneNumber(e.target.value) })
                            }}
                            disabled={!!systemOwnerLoginData.email}
                            className={`bg-white/10 border-white/20 text-white placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-sky-400 ${systemOwnerLoginErrors.phoneNumber ? "border-red-500" : ""}`}
                          />
                        </div>
                        {systemOwnerLoginErrors.phoneNumber && (
                          <p className="text-red-400 text-sm">{systemOwnerLoginErrors.phoneNumber}</p>
                        )}
                      </div>
                    </div>
                    
                    {!systemOwnerLoginOtpSent ? (
                      <Button 
                        onClick={() => {
                          console.log("hey there")
                          console.log("system ownder login data",systemOwnerLoginData)
                          ;(async () => {
                            console.log("system ownder login data",systemOwnerLoginData)
                            if (systemOwnerLoginData.email) {
                              const actionCodeSettings = {
                                url: window.location.origin + "/login",
                                handleCodeInApp: true,
                              }
                              try {
                                console.log("hey email")
                                setOtpButtonLoading(true)
                                await sendSignInLinkToEmail(auth, systemOwnerLoginData.email, actionCodeSettings)
                                window.localStorage.setItem("emailForSignIn", systemOwnerLoginData.email)
                                window.localStorage.setItem("emailSignInType", "system")
                                toast.success(`Sign-in link sent to ${systemOwnerLoginData.email}. Check your email to complete sign-in.`)
                                setOtpButtonLoading(false)
                                setSystemOwnerLoginOtpSent(true)
                                setSystemOwnerLoginResendCountdown(10)
                              } catch (err) {
                                console.error("Error sending email sign-in link:", err)
                                toast.error("Failed to send sign-in link. Please try again.")
                              }
                            } else if (systemOwnerLoginData.phoneNumber && systemOwnerLoginData.countryCode) {
                              console.log("hey mobile")
                              setOtpButtonLoading(true)
                              await handleSystemOwnerLoginVerifyNumber()
                              setOtpButtonLoading(false)
                            } else {
                              toast.error("Please enter either email or phone number")
                            }
                          })()
                        }}
                        disabled={!systemOwnerLoginData.email && (!systemOwnerLoginData.phoneNumber || !systemOwnerLoginData.countryCode) || otpButtonLoading}
                        className="w-full bg-sky-400 text-slate-900 hover:bg-sky-300 h-12 text-lg font-medium"
                      >
                        {!otpButtonLoading ? "Send OTP" : "Sending OTP"}
                        <Phone className="ml-2 w-4 h-4" />
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        {systemOwnerLoginData.email ? (
                          <div className="space-y-3">
                            <p className="text-slate-300">A sign-in link has been sent to <strong className="text-white">{systemOwnerLoginData.email}</strong>. Open the link in your email to complete sign-in.</p>
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => {
                                  ;(async () => {
                                    const actionCodeSettings = { url: window.location.origin + "/login", handleCodeInApp: true }
                                    try {
                                      await sendSignInLinkToEmail(auth, systemOwnerLoginData.email, actionCodeSettings)
                                      window.localStorage.setItem("emailForSignIn", systemOwnerLoginData.email)
                                      window.localStorage.setItem("emailSignInType", "system")
                                      toast.success(`Sign-in link resent to ${systemOwnerLoginData.email}.`)
                                      setSystemOwnerLoginResendCountdown(10)
                                    } catch (err) {
                                      console.error("Error resending email sign-in link:", err)
                                      toast.error("Failed to resend sign-in link. Please try again.")
                                    }
                                  })()
                                }}
                                className="flex-1 bg-sky-400 text-slate-900 hover:bg-sky-300 h-12 text-lg font-medium"
                              >
                                Resend Link
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSystemOwnerLoginOtpSent(false)}
                                className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 h-12 px-4"
                              >
                                Use Phone Instead
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="system-owner-login-otp" className="text-white font-medium">OTP Code</Label>
                              <Input
                                id="system-owner-login-otp"
                                type="text"
                                placeholder="Enter 6-digit OTP"
                                value={systemOwnerLoginOtp}
                                onChange={(e) => setSystemOwnerLoginOtp(e.target.value)}
                                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400 h-12 text-center text-lg"
                                maxLength={6}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Button onClick={handleSystemOwnerLogin} className="flex-1 bg-sky-400 text-slate-900 hover:bg-sky-300 h-12 text-lg font-medium" disabled={isLoading}>
                                {isLoading ? "Signing in..." : "System Owner Sign In"}
                                <Crown className="ml-2 w-4 h-4" />
                              </Button>
                              <Button 
                                type="button"
                                variant="outline"
                                onClick={handleSystemOwnerLoginResendOTP}
                                disabled={systemOwnerLoginResendCountdown > 0}
                                className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 h-12 px-4"
                              >
                                {systemOwnerLoginResendCountdown > 0 ? `Resend (${systemOwnerLoginResendCountdown}s)` : "Resend"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab("system-owner-register")} 
                      className="w-full border-slate-700 bg-slate-800 text-white hover:bg-slate-700 h-11"
                    >
                      Create System Owner Account
                      <Crown className="ml-2 w-4 h-4" />
                    </Button>
                  </TabsContent>

                  <TabsContent value="system-owner-register" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="system-owner-first-name" className="text-white font-medium">First Name</Label>
                        <Input
                          id="system-owner-first-name"
                          type="text"
                          placeholder="Enter first name"
                          value={systemOwnerRegisterData.first_name}
                          onChange={(e) => setSystemOwnerRegisterData({ ...systemOwnerRegisterData, first_name: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="system-owner-last-name" className="text-white font-medium">Last Name</Label>
                        <Input
                          id="system-owner-last-name"
                          type="text"
                          placeholder="Enter last name"
                          value={systemOwnerRegisterData.last_name}
                          onChange={(e) => setSystemOwnerRegisterData({ ...systemOwnerRegisterData, last_name: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="system-owner-register-email" className="text-white font-medium">Email</Label>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-300 flex-shrink-0" />
                        <Input
                          id="system-owner-register-email"
                          type="email"
                          placeholder="Enter your email"
                          value={systemOwnerRegisterData.email}
                          onChange={(e) => {
                            const email = e.target.value
                            setSystemOwnerRegisterData({ ...systemOwnerRegisterData, email })
                            setSystemOwnerRegisterErrors({ ...systemOwnerRegisterErrors, email: validateEmail(email) })
                          }}
                          onBlur={(e) => {
                            setSystemOwnerRegisterErrors({ ...systemOwnerRegisterErrors, email: validateEmail(e.target.value) })
                          }}
                          className={`bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400 ${systemOwnerRegisterErrors.email ? "border-red-500" : ""}`}
                        />
                      </div>
                      {systemOwnerRegisterErrors.email && (
                        <p className="text-red-400 text-sm">{systemOwnerRegisterErrors.email}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="system-owner-country-code" className="text-white font-medium">Country Code</Label>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-300 flex-shrink-0" />
                          <Input
                            id="system-owner-country-code"
                            type="text"
                            placeholder="+91"
                            value={systemOwnerRegisterData.countryCode}
                            onChange={(e) => setSystemOwnerRegisterData({ ...systemOwnerRegisterData, countryCode: e.target.value })}
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400"
                          />
                        </div>
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="system-owner-phone" className="text-white font-medium">Phone Number</Label>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-300 flex-shrink-0" />
                          <Input
                            id="system-owner-phone"
                            type="tel"
                            placeholder="Enter phone number"
                            value={systemOwnerRegisterData.phone_number}
                            onChange={(e) => {
                                const phone = e.target.value.replace(/\D/g, "")
                              setSystemOwnerRegisterData({ ...systemOwnerRegisterData, phone_number: phone })
                              setSystemOwnerRegisterErrors({ ...systemOwnerRegisterErrors, phone_number: validatePhoneNumber(phone) })
                            }}
                            onBlur={(e) => {
                              setSystemOwnerRegisterErrors({ ...systemOwnerRegisterErrors, phone_number: validatePhoneNumber(e.target.value) })
                            }}
                            className={`bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400 ${systemOwnerRegisterErrors.phone_number ? "border-red-500" : ""}`}
                          />
                        </div>
                        {systemOwnerRegisterErrors.phone_number && (
                          <p className="text-red-400 text-sm">{systemOwnerRegisterErrors.phone_number}</p>
                        )}
                      </div>
                    </div>
                    
                    {/*
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleSystemOwnerVerifyNumber}
                        disabled={systemOwnerOtpSent || !systemOwnerRegisterData.phone_number || !systemOwnerRegisterData.countryCode}
                        className="flex-1 border-slate-700 bg-slate-800 text-white hover:bg-slate-700 h-11"
                      >
                        {systemOwnerOtpSent ? "OTP Sent ✓" : "Verify Number"}
                      </Button>
                    </div>
                    */}
                    
                    {systemOwnerOtpSent && (
                      <div className="space-y-2">
                        <Label htmlFor="system-owner-otp" className="text-white font-medium">Enter OTP</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="system-owner-otp"
                            type="password"
                            placeholder="Enter 6-digit OTP"
                            value={systemOwnerOtp}
                            onChange={(e) => setSystemOwnerOtp(e.target.value)}
                            maxLength={6}
                            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400 h-12 text-center text-lg"
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleSystemOwnerRegisterResendOTP}
                            disabled={systemOwnerRegisterResendCountdown > 0}
                            size="sm"
                            className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 h-12 px-4"
                          >
                            {systemOwnerRegisterResendCountdown > 0 ? `Resend (${systemOwnerRegisterResendCountdown}s)` : "Resend"}
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="system-owner-access-key" className="text-white font-medium">Access Key</Label>
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-slate-300 flex-shrink-0" />
                        <Input
                          id="system-owner-access-key"
                          type="text"
                          placeholder="Enter system owner access key"
                          value={systemOwnerRegisterData.accessKey}
                          onChange={(e) => setSystemOwnerRegisterData({ ...systemOwnerRegisterData, accessKey: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400"
                        />
                      </div>
                    </div>

                    <Button onClick={handleSystemOwnerRegister} className="w-full bg-sky-400 text-slate-900 hover:bg-sky-300 h-12 text-lg font-medium" disabled={isLoading}>
                      {isLoading ? "Creating system owner account..." : "Create System Owner Account"}
                      <Crown className="ml-2 w-4 h-4" />
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab("system-owner-login")} 
                      className="w-full border-slate-700 bg-slate-800 text-white hover:bg-slate-700 h-11"
                    >
                      Back to System Owner Login
                      <LogIn className="ml-2 w-4 h-4" />
                    </Button>
                  </TabsContent>
                  </div>
              </Tabs>
            </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div id="recaptcha-container"></div>
      <SiteFooter brandName="Wingman Pro" />
    </>
  )
}


