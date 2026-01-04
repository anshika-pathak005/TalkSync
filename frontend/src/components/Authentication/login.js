import { Button, FormControl, InputGroup, InputRightElement, VStack } from "@chakra-ui/react";
import { Input } from "@chakra-ui/react";
import { FormLabel } from "@chakra-ui/react";
// import { connect } from "mongoose";
import React from "react";
import { useState } from "react";
import { useToast } from "@chakra-ui/react";
import axios from "axios";
import { useHistory } from "react-router-dom";
import { ChatState } from "../../context/ChatProvider";


const Login = () => {
  // defining the states for the form inputs
  const [show, setShow] = useState(false);
  //   if show clicked then inverse the value of show
  // function to handle the show/hide of password
  const handleshowClick = () => setShow(!show);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading,setLoading]=useState(false);
  const toast = useToast();
  const history=useHistory();
  // because when user logs in we need to set the user to that user
  const { setUser } = ChatState();


  
  const submitHandler = async () => {
    setLoading(true);
    // if fields are empty
    if (!email || !password) {
      toast({
        title: "Please fill all the fields",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
      return;
    }

    // if validation is ok then send the request to the server
    try {
      const config = {
        headers: {
          "Content-type": "application/json",
        },
      };
      const { data } = await axios.post(
        "/api/user/login",
        { email, password },
        config
      );
      // console.log(data);

      // show success toast
      toast({
        title: "Login Successful",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });

      // save the user info in local storage
      localStorage.setItem("userInfo", JSON.stringify(data));
      setLoading(false);

      // setting this data to user
      setUser(data);

      // push to chat page
      history.push("/chats");

    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: error.response.data.message,
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);

    }
  }

  return (
    <VStack spacing="5px">

      <FormControl id="login-email" spacing="5px">
        <FormLabel>Email:</FormLabel>
        <Input
          onChange={(e) => {
            setEmail(e.target.value);
          }}
          placeholder="Enter your Email"
        ></Input>
      </FormControl>

      <FormControl id="login-password" spacing="5px">
        <FormLabel>Password:</FormLabel>
        <InputGroup>
          <Input
            type={show ? "text" : "password"}
            isRequired={true}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            placeholder="Enter your Password"
          ></Input>
          <InputRightElement width={"4rem"}>
            <Button h={"1.5rem"} size={"sm"} onClick={handleshowClick}>
              {show ? "Hide" : "Show"}
            </Button>
          </InputRightElement>
        </InputGroup>
      </FormControl>

      <Button
        colorScheme="purple"
        width="80%"
        style={{ marginTop: 15 }}
        isLoading={loading}
        loadingText="Logging In"
      onClick={submitHandler}
      >
        Login
      </Button>



    </VStack>
  );
};


export default Login;
