package com.www.zz.fileuploadbackend.service;


import com.www.zz.fileuploadbackend.model.dto.FileNode;
import com.www.zz.fileuploadbackend.model.dto.IndexResult;
import com.www.zz.fileuploadbackend.model.dto.req.RenameFile;

import java.util.List;

public interface ILocalFileService {

    List<String> getDrives();

    IndexResult buildIndex(List<String> drives);

    List<String> searchFiles(String keyword);

    FileNode getFileTree(String path, boolean showFiles, boolean showFolders, int maxDepth);

    String encryptFile(String filePath, String password);

    String decryptFile(String filePath, String password);

    void batchRenameFile(List<RenameFile> fileRenames);

}
