package com.www.zz.fileuploadbackend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Map;

@AllArgsConstructor
@Data
public class NotifyMessage {

    private String type;

    private Map<String, Object> data;

}
