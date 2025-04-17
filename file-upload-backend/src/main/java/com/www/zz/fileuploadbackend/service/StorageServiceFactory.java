package com.www.zz.fileuploadbackend.service;

import com.www.zz.fileuploadbackend.config.base.BusinessException;
import com.www.zz.fileuploadbackend.model.entity.StorageConfig;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;

@Service
public class StorageServiceFactory {

    @Resource(name = "minioStorageService")
    private IStorageService minioStorageService;

    @Resource(name = "localStorageService")
    private IStorageService localStorageService;

    @Resource(name = "ossStorageService")
    private IStorageService ossStorageService;

    /**
     * 根据存储类型获取对应的存储服务
     * @param storageType 存储类型
     * @return 对应的存储服务实例
     */
    public IStorageService getStorageService(String storageType) {
	    return switch (storageType) {
		    case StorageConfig.MINIO -> minioStorageService;
		    case StorageConfig.OSS -> ossStorageService;
		    case StorageConfig.LOCAL -> localStorageService;
		    default -> throw new BusinessException("不支持的存储类型");
	    };
    }
}