package com.www.zz.demo02sb.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.www.zz.demo02sb.common.R;
import com.www.zz.demo02sb.entity.Files;
import com.www.zz.demo02sb.model.FileUploadInfo;
import com.www.zz.demo02sb.model.UploadUrlsVO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;

import java.util.List;

/**
 * 文件表 服务类
 */
public interface IFilesService extends IService<Files> {

    R<FileUploadInfo> checkFileByMd5(String md5);

    R<UploadUrlsVO> initMultipartUpload(FileUploadInfo fileUploadInfo);

    R<String> mergeMultipartUpload(String md5);

    ResponseEntity<byte[]> downloadMultipartFile(Long id, HttpServletRequest request, HttpServletResponse response) throws Exception;

    R<List<Files>> getFileList();
}
