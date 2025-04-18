package com.www.zz.fileuploadbackend.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;
import java.io.Serializable;

@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("storage_config")
public class StorageConfig implements Serializable {

    public static final String LOCAL = "local";
    public static final String MINIO = "minio";
    public static final String OSS = "oss";
    public static final String OBS = "obs";


    private static final long serialVersionUID=1L;

    /**
     * 配置id
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Integer id;

    /**
     * 存储类型：'local','minio','oss','obs'
     */
    @NotNull(message = "存储类型不能为空")
    @Pattern(regexp = "local|minio|oss|obs", message = "存储类型必须是 'local', 'minio', 'oss', 'obs' 之一")
    private String type;

    /**
     * 访问地址
     */
    private String endpoint;

    /**
     * 用户名
     */
    private String accessKey;

    /**
     * 密码
     */
    private String secretKey;

    /**
     * 桶
     */
    private String bucket;

}