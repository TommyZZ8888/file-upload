package com.www.zz.fileuploadbackend.model.dto.req;

import lombok.Data;

@Data
public class RenameFile {

    private String absolutePath;

    private String newName;

}
