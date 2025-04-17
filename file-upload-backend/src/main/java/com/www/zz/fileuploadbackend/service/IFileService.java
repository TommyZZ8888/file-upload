package com.www.zz.fileuploadbackend.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.www.zz.fileuploadbackend.model.entity.UploadFile;

import java.util.List;

public interface IFileService {

    IPage<UploadFile> pageFiles(Integer page, Integer pageSize, String storageType, String fileName);

    List<UploadFile> listSharedFiles();

    void addSharedFile(String identifier);

    void removeSharedFile(String fileIdentifier);

    void deleteFile(String fileIdentifier);
}
