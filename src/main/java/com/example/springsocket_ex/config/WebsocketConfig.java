package com.example.springsocket_ex.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;


// Websocket이란 무엇인가?
/* 서버와 클라이언트 사이에 양방향 통신 채널을 구축할 수 있는 통신 프로토콜이다.
동작 방식은 먼저 HTTP 통신을 연결하고 이후  Upgrade 헤더를 보내 양뱡향 연결로 업그레이드 한다.

*
* */
@Configuration
@EnableWebSocketMessageBroker
/* @EnableWebSocketMessageBroker :  websocket 서버를 사용한다는 설정이다 . 또한 WebSocketMessageBrokerConfigurer를 상속받아
   몇몇 메소드를 구현하여 websocket 연결 속성을 설정한다.
*/
public class WebsocketConfig implements WebSocketMessageBrokerConfigurer {

    // configureMessageBroker 는 한 클라이언트에서 다른 클라이언트로 메시지를 라우팅 할 때 사용하는 브로커를 구성한다.
    // 첫번째 라인에서 정의된 /app로 시작하는 메시지만 메시지 핸들러로 라운팅한다고 정의한다.
    // 두번째 라인에서 정의된 /topic으로 시작하는 주제를 가진 메시지를 핸들러로 라우팅하여 해당 주제에 가입한 모든 클라이언트에게 메시지를 발송한다.
    // ex) /app로 시작하는 메시지를 핸들러로 라우팅 -> 이후 /chatroom은 한명이 message를 발행했을 때 해당 토픽을 구독하고 있는 n명에게 다시 메세지를 뿌림
    // /user는 한명이 message를 발행했을 때 발행한 한 명에게 다시 정보를 보내는 경우에 사용
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/app");
        // 도착 경로에 대한 prefix를 설정 -> /topic/hello라는 토픽에 대해 구독을 신청했을 때 실제 경로는 /app/topic/hello가 된다.
        registry.enableSimpleBroker("/chatroom", "/user");
        registry.setUserDestinationPrefix("/user");
        /* registry.setUserDestinationPrefix("/user");
          사용자 대상을 식별하는 데 사용되는 접두사를 구성합니다. 사용자 대상은 사용자가 자신의 세션에 고유한 대기열 이름을 구독하고
          다른 사용자가 고유한 사용자별 대기열에 메시지를 보낼 수 있는 기능을 제공합니다.
          예를 들어 사용자가 "/user/queue/position-updates"에 가입을 시도하면 대상이 "/queue/position-updatesi9oqdfzo"로 변환되어
          시도하는 다른 사용자와 충돌하지 않는 고유한 대기열 이름을 생성할 수 있습니다. 똑같다. 이후에 메시지가 "/user/{username}/queue/position-updates"로
          전송되면 대상이 "/queue/position-updatesi9oqdfzo"로 변환됩니다.
          이러한 대상을 식별하는 데 사용되는 기본 접두사는 "/user/"입니다.
        */
    }

    //채팅 클라이언트가 서버와 연결하는 웹소켓 셋팅 부분 ->웹소켓 연결 주소 ->
    @Override // registerStompEndpoints를 이용하여 클라이언트에서 websocket에 접속하는 endpoint를 등록한다.
    //  STOMP(Simple Text Oriented Messaging Protocol) : 스프링 프레임워크의 stomp 구현체를 사용한다는 의미다.
    // STOMP가 필요한 이유는 websocket은 통신 프로토콜이지 특정 주제에 가입한 사용자에게 메시지를 전송하는 기능을 제공하지 않는다.
    // 이를 쉽게 사용하기 위해 stomp를 사용한다.
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").setAllowedOriginPatterns("*").withSockJS();
    }
}
