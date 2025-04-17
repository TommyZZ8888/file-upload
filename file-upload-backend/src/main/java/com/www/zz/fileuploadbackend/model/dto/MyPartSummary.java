package com.www.zz.fileuploadbackend.model.dto;

import java.util.Date;

public interface MyPartSummary {

    int getPartNumber();

    Date getLastModified();

    String getETag();

    long getSize();

}