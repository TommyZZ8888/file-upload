package com.www.zz.fileuploadbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication
public class FileUploadBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(FileUploadBackendApplication.class, args);
	}

}
