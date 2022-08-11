package com.example.springsocket_ex.controller;


import com.example.springsocket_ex.model.MessageDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RestController;


//https://hyeooona825.tistory.com/89 참고 해보기
/*
* 웹소켓은 처음 connect 시점에 handshake라는 작업이 수행됨 handshake 과정은 HTTP 통신을 기반으로 이루어지며 GET 방식으로 통신을 하게 됨
* 이때, HTTP 요청 헤더의 Connection 속성은 Upgrade로 되어야 한다.
* 웹소켓은 3번의 handshake를 거쳐 연결을 확정
*
*
* */
@Controller
//@RequiredArgsConstructor
/*
* @RequiredArgsConstructor 이 어노테이션은 초기화 되지 않은 final 필드나 , @Nonnull이 붙은 필드에 대해 생성자를 생성해줍니다.
* 주로 의존성 주입 편의성을 위해 사용되곤 합니다.
* */
public class ChatController {

    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;

    @MessageMapping("/message") // /app/message 어노테이션에 발행하는 경로를 @SendTo와 @SendToUser어노테이션에 구독 경로를 작성합니다.
    @SendTo("/chatroom/public") // 예를 들어 , 특정 사용자가 message라는 경로로 메세지를 보내면 /chatroom/public라는 토픽을 구독하는 사용자에게 모두 메세지를 뿌립니다.
    /*@SendTo는 1:n으로 메세지를 뿌릴 때 사용하는 구조이다.    */
    public MessageDTO receivePublicMessage(@Payload MessageDTO messageDTO){
        return messageDTO;
    }

    @MessageMapping("/private-message")
    public MessageDTO receivePrivateMessage(@Payload MessageDTO messageDTO){
        // 연결된 클라이언트한테 문자를 보낼때 사용하는 방법
        // 브로커를 설정하지 않은 경우 simpMessagingTemplate을 주입받아서 사용한다.
        // 간단하게 /private를 구독하고 있는 클라이언트들에게 messageDTO를 받아서 전송한다.
        simpMessagingTemplate.convertAndSendToUser(messageDTO.getReceiverName(), "/private", messageDTO); // ex) /user/David/private

        return messageDTO;
    }
}
