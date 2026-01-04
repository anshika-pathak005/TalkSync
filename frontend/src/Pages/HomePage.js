import React from 'react'
import { Container, Box, Tabs, Tab, TabList, TabPanels, TabPanel } from "@chakra-ui/react"
import Login from '../components/Authentication/login';
import SignUp from '../components/Authentication/singUp';
import { useHistory } from 'react-router-dom';
// import { useEffect } from 'react';.
import { useEffect } from 'react';

const HomePage = () => {

  // if user is logged in then redirect to chats page
  const history = useHistory();
  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));

    if (userInfo) {
      history.push("/chats");
    }
  }, [history]);

  return (
    <Container maxWidth='xxl' centerContent>
      {/* header */}
      <Box
        d='flex'
        justifyContent='center'
        alignItems='center'
        p={4}
        bg={"white"}
        w={"100%"}
        m={"15px 0 15px 0"}
        borderRadius='lg'
        borderWidth='1px'
        fontSize='3xl'
        textAlign={"center"}
        shadow="1px 1px 10px 1px rgba(57, 57, 58, 0.2)"
        fontFamily="Nunito, sans-serif"
        fontWeight={"bold"}
        boxShadow="md"
      >
        TalkSync - Where Conversations Sync
      </Box>
      {/* mainbox */}
      <Box maxWidth='xl' w='100%' borderRadius='lg' borderWidth='1px' bg='white'>
        <Tabs variant='soft-rounded' colorScheme='purple'>
          {/* <Tabs variant='soft-rounded'> */}
          <TabList m="1rem">
            <Tab width='50%'>Login</Tab>
            <Tab width='50%'>Register</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Login />
            </TabPanel>
            <TabPanel>
              <SignUp />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  )
}

export default HomePage
