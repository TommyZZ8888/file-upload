package com.www.zz.fileuploadbackend;

import com.www.zz.fileuploadbackend.dao.UploadFileMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class FileUploadBackendApplicationTests {


	@Autowired
	private UploadFileMapper uploadFileMapper;

	@Test
	void contextLoads() {
		uploadFileMapper.selectList(null);
	}




}
