/* eslint-disable react-hooks/rules-of-hooks */
import { useCallback, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Container,
  HStack,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Text,
} from "@chakra-ui/react";

import ModalStore from "@/src/store/ModalStore";
import {
  approveEIP155Request,
  rejectEIP155Request,
} from "@/src/utils/EIP155RequestHandlerUtil";
import { getSignParamsMessage } from "@/src/utils/HelperUtil";
import { web3wallet } from "@/src/utils/WalletConnectUtil";
import { EIP155_CHAINS } from "../data/EIP155Data";

export default function SessionSignModal() {
  // Get request and wallet data from store
  const requestEvent = ModalStore.state.data?.requestEvent;
  const requestSession = ModalStore.state.data?.requestSession;
  const [isLoadingApprove, setIsLoadingApprove] = useState(false);
  const [isLoadingReject, setIsLoadingReject] = useState(false);

  // Ensure request and wallet are defined
  if (!requestEvent || !requestSession) {
    return <Text>Missing request data</Text>;
  }

  // Get required request data
  const { topic, params } = requestEvent;
  const { request, chainId } = params;

  // Get message, convert it to UTF8 string if it is valid hex
  const message = getSignParamsMessage(request.params);

  // Handle approve action (logic varies based on request method)
  const onApprove = useCallback(async () => {
    if (requestEvent) {
      setIsLoadingApprove(true);
      const response = await approveEIP155Request(requestEvent);
      try {
        await web3wallet.respondSessionRequest({
          topic,
          response,
        });
      } catch (e) {
        setIsLoadingApprove(false);
        console.log((e as Error).message, "error");
        return;
      }
      setIsLoadingApprove(false);
      ModalStore.close();
    }
  }, [requestEvent, topic]);

  // Handle reject action
  const onReject = useCallback(async () => {
    if (requestEvent) {
      setIsLoadingReject(true);
      const response = rejectEIP155Request(requestEvent);
      try {
        await web3wallet.respondSessionRequest({
          topic,
          response,
        });
      } catch (e) {
        setIsLoadingReject(false);
        console.log((e as Error).message, "error");
        return;
      }
      setIsLoadingReject(false);
      ModalStore.close();
    }
  }, [requestEvent, topic]);

  const { icons, name, url } = requestSession.peer.metadata;

  return (
    <ModalContent bg={"gray.900"}>
      <ModalHeader>Request a Signature</ModalHeader>
      <ModalCloseButton />
      <ModalBody pb={6}>
        <Container>
          <Avatar src={icons[0]} />
          <Text>{name}</Text>
          <Text>{url}</Text>
        </Container>
      </ModalBody>
      <ModalFooter>
        <Box>Chain: {EIP155_CHAINS[chainId].name}</Box>
        <Box>
          <Text>Message</Text>
          <Text>{message}</Text>
        </Box>
        <HStack>
          <Button onClick={() => onReject()} isLoading={isLoadingReject}>
            Reject
          </Button>
          <Button onClick={() => onApprove()} isLoading={isLoadingApprove}>
            Approve
          </Button>
        </HStack>
      </ModalFooter>
    </ModalContent>
  );
}
