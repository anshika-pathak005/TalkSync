import { Button, FormControl, InputGroup, InputRightElement, VStack } from "@chakra-ui/react";
import { Input } from "@chakra-ui/react";
import { FormLabel } from "@chakra-ui/react";
import React from "react";
import { useState } from "react";
import { useToast } from "@chakra-ui/react";
import axios from "axios";
import { useHistory } from "react-router-dom";
import { ChatState } from "../../context/ChatProvider";


const SignUp = () => {
    // defining the states for the form inputs
    const [show, setShow] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    //   if show clicked then inverse the value of show
    // function to handle the show/hide of password
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [pic, setPic] = useState("");
    // for loading state
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState("Sign Up");
    const toast = useToast();
    const history = useHistory();

    const {setUser} = ChatState();

    const handleShowPassword = () => setShowPassword(!showPassword);
    const handleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

    const submitHandler = async () => {
        setLoading(true);
        setLoadingText("Registering...");

        // form validation

        if (!name || !email || !password || !confirmPassword) {
            toast({
                title: "Please fill all the fields",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });
            setLoading(false);
            setLoadingText("Sign Up");
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast({
                title: "Invalid Email",
                description: "Please enter a valid email address",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });
            setLoading(false);
            setLoadingText("Sign Up");
            return;
        }

        if (password !== confirmPassword) {
            toast({
                title: "Password do no Match",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });
            setLoading(false);
            setLoadingText("Sign Up");
            return;
        }

        // if everything is fine then proceed further
        try {
            const config = {
                headers: {
                    "Content-type": "application/json",
                },
            };

            const { data } = await axios.post("/api/user", { name, email, password, pic }, config);

            toast({
                title: "Registration Successful",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });

            console.log("hello its done")
            localStorage.setItem("userInfo", JSON.stringify(data));
            setUser(data);
            setLoading(false);
            setLoadingText("Sign Up");

            history.push("/chats");

        } catch (error) {
            console.log("hello its not done")

            toast({
                title: "Error Occurred!",
                description: error.response.data.message,
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });
            setLoading(false);
            setLoadingText("Sign Up");
            return;
        }
    }

    const postDetails = (pics) => {
        setLoading(true);
        setLoadingText("Uploading Image...");

        // if no picture is selected
        if (pics === undefined) {
            toast({
                title: "Please select an Image!",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });
            setLoading(false);
            setLoadingText("Sign Up");
            return;
        }
        // if the picture is selected
        if (pics.type === "image/jpeg" || pics.type === "image/png") {
            const data = new FormData();
            data.append("file", pics);
            data.append("upload_preset", "TalkSync");
            data.append("cloud_name", "do0itnacu");

            fetch("https://api.cloudinary.com/v1_1/do0itnacu/image/upload", {
                method: "post",
                body: data,
            }).then((res) => res.json())
                .then((data) => {
                    setPic(data.url.toString());
                    setLoading(false);
                    setLoadingText("Sign Up");
                    console.log(data.url.toString());
                }).catch((err) => {
                    console.log(err);
                    setLoading(false);
                    setLoadingText("Sign Up");
                })
        } else {
            toast({
                title: "Please select an Image!",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });
            setLoading(false);
            setLoadingText("Sign Up");
            return;
        }
    };

    return (
        <VStack spacing="5px">

            <FormControl id="name" spacing="5px">
                <FormLabel>Name:</FormLabel>
                <Input
                    isRequired={true}
                    onChange={(e) => {
                        setName(e.target.value);
                    }}
                    placeholder="Enter your Name"
                ></Input>
            </FormControl>

            <FormControl id="singup-email" spacing="5px">
                <FormLabel>Email:</FormLabel>
                <Input
                    onChange={(e) => {
                        setEmail(e.target.value);
                    }}
                    placeholder="Enter your Email"
                ></Input>
            </FormControl>

            <FormControl id="signup-password" spacing="5px">
                <FormLabel>Password:</FormLabel>
                <InputGroup>
                    <Input
                        type={showPassword ? "text" : "password"}
                        isRequired={true}
                        onChange={(e) => {
                            setPassword(e.target.value);
                        }}
                        placeholder="Enter your Password"
                    ></Input>
                    <InputRightElement width={"4rem"}>
                        <Button h={"1.5rem"} size={"sm"} onClick={handleShowPassword}>
                            {showPassword ? "Hide" : "Show"}
                        </Button>
                    </InputRightElement>
                </InputGroup>
            </FormControl>

            {/* confirm password here */}
            <FormControl id="confirm-pass" spacing="5px">
                <FormLabel>Confirm Password:</FormLabel>
                <InputGroup>
                    <Input
                        type={showConfirmPassword ? "text" : "password"}
                        isRequired={true}
                        onChange={(e) => {
                            setConfirmPassword(e.target.value);
                        }}
                        placeholder="Enter your Password"
                    ></Input>
                    <InputRightElement width={"4rem"}>
                        <Button h={"1.5rem"} size={"sm"} onClick={handleShowConfirmPassword}>
                            {showConfirmPassword ? "Hide" : "Show"}
                        </Button>
                    </InputRightElement>
                </InputGroup>
            </FormControl>

            <FormControl id="pic" spacing="5px">
                <FormLabel>Upload your Picture:</FormLabel>
                <Input
                    type="file"
                    p={1.5}
                    accept="image/*"
                    onChange={(e) => {
                        postDetails(e.target.files[0]);
                    }}
                ></Input>
            </FormControl>

            <Button
                colorScheme="purple"
                width="80%"
                style={{ marginTop: 15 }}
                isLoading={loading}
                loadingText={loadingText}
                onClick={submitHandler}
            >
                Register
            </Button>

        </VStack>
    );
};

export default SignUp;