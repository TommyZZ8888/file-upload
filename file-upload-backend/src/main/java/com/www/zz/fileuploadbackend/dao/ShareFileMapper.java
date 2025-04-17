package com.www.zz.fileuploadbackend.dao;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.www.zz.fileuploadbackend.model.entity.SharedFile;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ShareFileMapper extends BaseMapper<SharedFile> {
}
