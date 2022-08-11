import React, { useEffect, useState } from 'react'
import {over} from 'stompjs';
import SockJS from 'sockjs-client';

// 벡엔드 스프링 쪽에서 stomp라는 서브 프로토콜을 사용하기로 결정이 되었으므로 
// 웹소켓의 서브 프로토콜인 stomp 위에서 sockJS가 정상적으로 작동되고 
// stomp 프로토콜 환경에서 stompJS에서 제공하는 프로토콜 연결, 메시지 전송, 상대방 구독 기능을 제공한다.

var stompClient = null;

const Chat = () => {
    const [privateChats, setPrivateChats] = useState(new Map());     

    const [publicChats, setPublicChats] = useState([]); 

    const [tab,setTab] = useState("CHATROOM");

    const [userData, setUserData] = useState({
        username: '',
        receivername: '',
        connected: false,
        message: ''
      });

    // 해당 데이터가 업데이트 되면 console에 찍어주겠다. 
    useEffect(() => {
      console.log(userData);
    }, [userData]);  
    // : useEffect :
    // 이곳에 배열이 있는 이유 해당 위치의 (이를 deps라고 부른다.) 배열 안에 검사하고 싶은 값이 존재할 경우 
    // 특정값이 업데이트 될 때만 실행하고 싶을 때는 deps위치의 배열 안에 실행 조건을 넣어준다. 
    // 참조 사이트 :  https://cocoon1787.tistory.com/796  , https://xiubindev.tistory.com/100

    const connect =()=>{
        // 연결할 소켓js의 인자로 프로토콜의 URI를 입력해주고 임의의 변수에 할당 -> stomp프로토콜 위에 sockJS가 돌아가도록 Stomp.over()의 인자로 소켓 변수를 넣어준다. 
        // 상황에 따라 stompClient라는 변수에 서버 연결, 메세지 전송, 상대방 구독 관련 값을 추가 할당하기에 자주 사용될 것이다. 
        let Sock = new SockJS('http://localhost:8080/ws');
        stompClient = over(Sock);
        // 서버 연결 
        // 서버에 연결하기 위해 서버에 connect 프레임을 전송  
        // 프레임이란? 명령어, 선택사항인 헤더 집합,  선택사항인 body로 구성되어 있으며 이 프레임이라는 것을
        // 클라이언트와 주고 받음으로써 통신을 실시간으로 상호작용을 할 수 있다. 
        // {} 이것은 connect 프레임을 전송할 때 같이 전송하는 헤더를 설정하는 곳이다. 
        // 연결 완료시 콜백함수가 실행 -> 콜백함수를 통해 서버 연결 후에 취할 다양한 액션을 넣을수 있다. 
        stompClient.connect({},onConnected, onError);
        // 연결시 취할 액션 onConnected , onError 
    }

    // 구독 ->  상대방에게 메세지를 보내거나 받아야 할 경우 특정  URI에 대해 구독해야함 
    // 예를 들어 우리가 누군가에게 우편을 보낼 때 받는 사람의 주소가 필요 하듯이 stompJS에서도 메세지를 보내거나 받기 위해 
    // 특정 URI를 알고 있어야 하며 그것을 구독해야한다. 
    // 만약 특정 URI를 구독한다면 이제 상대방이 해당 URI를 구독하고 메세지를 보내면 나는 해당 메세지를 받을 수 있다. 
    // 실제 예로 특정 채팅방에 입장하면 해당 채팅방으로부터 전송되는 메세지를 수신 할 수 있도록 subscribe프레임을 날리는 경우도 있다. 

    const onConnected = () => {
        
        setUserData({...userData,"connected": true});
        // subscribe()의 
        // 첫번째 인자는 구독할 URI
        // 두번째 인자는 구독한 후에 실행될 콜백함수이며 구독 이후 
        // 세번째 인자는 지금은 없지만 subscribe 프레임을 전송할 때 같이 보내는 헤더를 설정하는 곳이다. 
        // 상대방으로부터 메세지를 수신 받을 때 마다 해당 콜백함수가 실행된다. 
        stompClient.subscribe('/chatroom/public', onMessageReceived);
        stompClient.subscribe('/user/'+userData.username+'/private', onPrivateMessage);
        userJoin();
    }
    // 연결될 경우 userJoin을 통해서 JOIN 상태 값과 유저이름을 전송한다.  /app/message에 전송 
    const userJoin= () =>{
          var chatMessage = {
            senderName: userData.username,
            status:"JOIN"
          };
          stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
    }

    // 메시지 수신 
    const onMessageReceived = (payload)=>{
        var payloadData = JSON.parse(payload.body);
        // eslint-disable-next-line default-case
        switch(payloadData.status){
            case "JOIN":
                if(!privateChats.get(payloadData.senderName)){
                    privateChats.set(payloadData.senderName,[]);
                    setPrivateChats(new Map(privateChats));
                }
                break;
            case "MESSAGE":
                publicChats.push(payloadData);
                setPublicChats([...publicChats]);
                break;
        }
    }
    
    const onPrivateMessage = (payload)=>{
        console.log(payload);
        var payloadData = JSON.parse(payload.body);
        if(privateChats.get(payloadData.senderName)){
            privateChats.get(payloadData.senderName).push(payloadData);
            setPrivateChats(new Map(privateChats));
        }else{
            let list =[];
            list.push(payloadData);
            privateChats.set(payloadData.senderName,list);
            setPrivateChats(new Map(privateChats));
        }
    }

    const onError = (err) => {
        console.log(err);
    }

    const handleMessage =(event)=>{
        const {value}=event.target;
        setUserData({...userData,"message": value});
    }

    const sendValue = () =>{
            if (stompClient) {
              var chatMessage = {
                senderName: userData.username,
                message: userData.message,
                status:"MESSAGE"
              };
              console.log(chatMessage);
              stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
              setUserData({...userData,"message": ""});
            }
    }

    const sendPrivateValue=()=>{
        if (stompClient) {
          var chatMessage = {
            senderName: userData.username,
            receiverName:tab,
            message: userData.message,
            status:"MESSAGE"
          };
          
          if(userData.username !== tab){
            privateChats.get(tab).push(chatMessage);
            setPrivateChats(new Map(privateChats));
          }
          stompClient.send("/app/private-message", {}, JSON.stringify(chatMessage));
          setUserData({...userData,"message": ""});
        }
    }

    const handleUsername=(event)=>{
        const {value}=event.target;
        setUserData({...userData,"username": value});
    }

    const registerUser=()=>{
        connect();
    }

    return (
        <div className="container">
            {userData.connected?
            <div className="chat-box">
                <div className="member-list">
                    <ul>
                        <li onClick={()=>{setTab("CHATROOM")}} className={`member ${tab==="CHATROOM" && "active"}`}>Chatroom</li>
                        {[...privateChats.keys()].map((name,index)=>(
                            <li onClick={()=>{setTab(name)}} className={`member ${tab===name && "active"}`} key={index}>{name}</li>
                        ))}
                    </ul>
                </div>
                {tab==="CHATROOM" && <div className="chat-content">
                    <ul className="chat-messages">
                        {publicChats.map((chat,index)=>(
                            <li className={`message ${chat.senderName === userData.username && "self"}`} key={index}>
                                {chat.senderName !== userData.username && <div className="avatar">{chat.senderName}</div>}
                                <div className="message-data">{chat.message}</div>
                                {chat.senderName === userData.username && <div className="avatar self">{chat.senderName}</div>}
                            </li>
                        ))}
                    </ul>

                    <div className="send-message">
                        <input type="text" className="input-message" placeholder="enter the message" value={userData.message} onChange={handleMessage} /> 
                        <button type="button" className="send-button" onClick={sendValue}>send</button>
                    </div>
                </div>}
                {tab!=="CHATROOM" && <div className="chat-content">
                    <ul className="chat-messages">
                        {[...privateChats.get(tab)].map((chat,index)=>(
                            <li className={`message ${chat.senderName === userData.username && "self"}`} key={index}>
                                {chat.senderName !== userData.username && <div className="avatar">{chat.senderName}</div>}
                                <div className="message-data">{chat.message}</div>
                                {chat.senderName === userData.username && <div className="avatar self">{chat.senderName}</div>}
                            </li>
                        ))}
                    </ul>

                    <div className="send-message">
                        <input type="text" className="input-message" placeholder="enter the message" value={userData.message} onChange={handleMessage} /> 
                        <button type="button" className="send-button" onClick={sendPrivateValue}>send</button>
                    </div>
                </div>}
            </div>
            :
            <div className="register">
                <input
                    id="user-name"
                    placeholder="Enter your name"
                    name="userName"
                    value={userData.username}
                    onChange={handleUsername}
                    margin="normal"
                />
                {/* { 버튼을 눌르면  } */}
                <button type="button" onClick={registerUser}>
                        connect
                </button> 
            </div>}
        </div>
    )
}

export default Chat