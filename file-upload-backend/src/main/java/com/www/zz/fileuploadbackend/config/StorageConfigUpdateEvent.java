package com.www.zz.fileuploadbackend.config;

import com.www.zz.fileuploadbackend.model.entity.StorageConfig;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class StorageConfigUpdateEvent extends ApplicationEvent {

    private final StorageConfig newConfig;

    public StorageConfigUpdateEvent(Object source, StorageConfig newConfig) {
        super(source);
        this.newConfig = newConfig;
    }

}