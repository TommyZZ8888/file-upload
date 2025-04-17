package com.www.zz.fileuploadbackend.dao;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.www.zz.fileuploadbackend.model.entity.UploadFile;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UploadFileMapper extends BaseMapper<UploadFile> {


    IPage<UploadFile> pageFiles(@Param("page") Page<UploadFile> page,
                                @Param("storageType") String storageType,
                                @Param("fileName") String fileName);

}