package com.example.springsocket_ex.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class MessageDTO {
    private String senderName;
    private String receiverName;
    private String message;
    private String date;
    private String status;
}
