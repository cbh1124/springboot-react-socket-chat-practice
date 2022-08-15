import React, { useEffect, useState } from 'react'
import {over} from 'stompjs';
import SockJS from 'sockjs-client';

// 벡엔드 스프링 쪽에서 stomp라는 서브 프로토콜을 사용하기로 결정이 되었으므로 
// 웹소켓의 서브 프로토콜인 stomp 위에서 sockJS가 정상적으로 작동되고 
// stomp 프로토콜 환경에서 stompJS에서 제공하는 프로토콜 연결, 메시지 전송, 상대방 구독 기능을 제공한다.
var stompClient = null;

const Chat = () => {
    const [privateChats, setPrivateChats] = useState(new Map());     // 개인 채팅 메세지 

    const [publicChats, setPublicChats] = useState([]);  // 채팅 메세지 

    const [tab,setTab] = useState("CHATROOM");      // CHATROOM 상태 

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
        stompClient.subscribe('/chatroom/public', onMessageReceived); // 메세지 수신 액션 구독
        stompClient.subscribe('/user/'+userData.username+'/private', onPrivateMessage); // 개인 메세지 수신 액션 구독 해당 메시지에 데이터 전달
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

    // 메시지 수신 전달 받은 payload 확인 
    const onMessageReceived = (payload)=>{
        var payloadData = JSON.parse(payload.body);
        // eslint-disable-next-line default-case
        switch(payloadData.status){
            // 전달받은 payloadData.status 값이 조건 값 -> 조건 값에 따라 case 구분
            case "JOIN":
                // JOIN일 경우 만약 privateChats의 키 값이 
                if(!privateChats.get(payloadData.senderName)){
                    //privateChats
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
    //  전달 받은 payload 확인 
    const onPrivateMessage = (payload)=>{
        console.log(payload);
        var payloadData = JSON.parse(payload.body);
        // 만약 privateChats의 map타입에서 해당 senderName(메세지를 보낸사람)의 키가 일치한다면 
        if(privateChats.get(payloadData.senderName)){
            // 해당 키의 값에 value를 push 
            privateChats.get(payloadData.senderName).push(payloadData);
            // (push 한)쌓은 값을 기존의 privateChats state에 전달 
            setPrivateChats(new Map(privateChats));
        }else{
            let list =[];
            // 만약 privateChats의 키와 다르다면 리스트이 값에 담아서 key와 value값을 privateChats에 담는다. 
            list.push(payloadData);
            // privateChats의 키와 list의 value를 map타입으로 바꾸고 담아서 기존의 state에 전달한다. 
            privateChats.set(payloadData.senderName,list);
            setPrivateChats(new Map(privateChats));
        }
    }

    const onError = (err) => {
        console.log(err);
    }
 
    // handelMessage를 onchange를 통해서 값 state로 메세지 전달 
    const handleMessage =(event)=>{
        const {value}=event.target;
        setUserData({...userData,"message": value});
        console.log(userData)
    }

    const sendValue = () =>{
        // 만약 stompClient에 소켓이 존재한다면 /app/message로 값을 전달  
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
            console.log(userData)
    }

    const sendPrivateValue=()=>{
        // 만약 stompClient에 소켓이 존재한다면 /app/private-message로 값을 전달 // 현재 tab상태를 전달한다. 
        // tab은 -> 개인 아이디상태 or CHATROOM(PublicChat)을 나타냄 
        if (stompClient) {
          var chatMessage = {
            senderName: userData.username,
            receiverName:tab,
            message: userData.message,
            status:"MESSAGE"
          };
          // 만약 클라이언트의 username과 tab의 이름이 다르다면 
          if(userData.username !== tab){
            // privateChats의 키의 tab의 이름에 value값에 chatmessage 상태 값들을 저장 
            privateChats.get(tab).push(chatMessage);
            // map 형으로 바꾼 후 state값에 전달 
            setPrivateChats(new Map(privateChats));
          }
          stompClient.send("/app/private-message", {}, JSON.stringify(chatMessage));
          // 클라이언트의 상태의 데이터에 message를 담는다 ...userData이므로 message를 쌓는다. . 
          setUserData({...userData,"message": ""});
          console.log(userData)
          console.log("check")
        }
    }

    // 등록할때 사용한다 username regist . 
    const handleUsername=(event)=>{
        const {value}=event.target;
        setUserData({...userData,"username": value});
    }

    // 33번째 줄 connect 함수 실행 서버 연결 
    const registerUser=()=>{
        connect();
    }

    return (
        <div className="container">
            {userData.connected?   // 삼항 연산자 만약 연결이되면 아래 화면 연결 안되면 register 화면 
            <div className="chat-box">
                <div className="member-list">
                    <ul>       
                        {/*  왼쪽 상단 네비게이션 CHATROOM */}  {/*  왼쪽 상단 네비게이션 CHATROOM active 상태라면 member class 작동 */} 
                        <li onClick={()=>{setTab("CHATROOM")}} className={`member ${tab==="CHATROOM" && "active"}`}>Chatroom</li>
                        {/*...은 참조형이다. 기존 privateChats의 값에서 가져온다. map함수이므로 keys를 통해서 가져온다. 키를 가져오는 것임  map -> ['cbh1124','cbh1111']*/}
                        {[...privateChats.keys()].map((name,index)=>(
                            // keys -> name은 tab의 상태를 알린다. 
                            <li onClick={()=>{setTab(name)}} className={`member ${tab===name && "active"}`} key={index}>{name}</li>
                        ))}
                    </ul>
                </div>
                {/* true && expression은 항상 expression으로 평가되고, false&&expression은 항상 false로 평가됩니다. 
                따라서 && 뒤의 엘리먼트는 조건이 true일때 출력이 됨 조건이 false라면 작동 안됨 */}

                {/* tab이 CHATROOM이라면  */}
                {tab==="CHATROOM" && <div className="chat-content">
                    <ul className="chat-messages">

                        {publicChats.map((chat,index)=>(
                            // chat.senderName(보내는사람)과 내가 아이디로 등록한 이름이 같다면 (본인 메시지 표시)
                            <li className={`message ${chat.senderName === userData.username && "self"}`} key={index}>
                                {/* chat.senderName(보내는사람)과 내가 아이디로 등록한 이름이 같지 않다면 (상대 메시지 표시) */}
                                {chat.senderName !== userData.username && <div className="avatar">{chat.senderName}</div>}
                                {/* index에 맞게 chat.message */}
                                <div className="message-data">{chat.message}</div>
                                {/* chat.senderName(보내는사람)과 내가 아이디로 등록한 이름이 같다면 (상대 메시지 표시) */}
                                {chat.senderName === userData.username && <div className="avatar self">{chat.senderName}</div>}
                            </li>
                        ))}
                    </ul>
                            
                    <div className="send-message">
                        {/* state에 message 전달   onChange를 통해서 메시지 전달 */}
                        <input type="text" className="input-message" placeholder="enter the message" value={userData.message} onChange={handleMessage} /> 
                        {/* 버튼 누르면 서버로 유저 정보 및 액션 상태 유저 메시지를 전달 */}
                        <button type="button" className="send-button" onClick={sendValue}>send</button>
                    </div>
                </div>}

                {/* tab이 CHATROOM이 아니라면 개인 메시지 상태가 됨 */}
                {tab!=="CHATROOM" && <div className="chat-content">
                    <ul className="chat-messages">
                        {/* privateChats.get(tab) 탭에 해당하는 채팅 메시지를 출력한다.   */}
                        {[...privateChats.get(tab)].map((chat,index)=>(
                            // 해당 채팅의 보내는 이름과 현재 클라이언트(userData)의 이름이 같다면  
                            <li className={`message ${chat.senderName === userData.username && "self"}`} key={index}>
                                {/* 해당 채팅을 보내는 이름과 현재 클라이언트(userData)의 이름이 같지 않다면 상대 프로필 활성화 */}
                                {chat.senderName !== userData.username && <div className="avatar">{chat.senderName}</div>}
                                {/* 메세지는 그냥 보냄  */}
                                <div className="message-data">{chat.message}</div>
                                {/* 해당 채팅의 보내는 이름과 현재 클라이언트(userData)의 이름이 같다면 자기 프로필 활성화  */}
                                {chat.senderName === userData.username && <div className="avatar self">{chat.senderName}</div>}
                            </li>
                        ))}
                    </ul>
                    {/* 메세지를 보내는 곳  */}
                    <div className="send-message">
                        <input type="text" className="input-message" placeholder="enter the message" value={userData.message} onChange={handleMessage} /> 
                        <button type="button" className="send-button" onClick={sendPrivateValue}>send</button>
                    </div>
                </div>}

            </div>
            :
            // 연결이 되지 않았으므로 등록버튼이 뜨도록 한다. 
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
            </div>} {/* {userData.connected? end */}
            
        </div>
    )
}

export default Chat