package com.www.zz.demo02sb;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.www.zz.demo02sb.mapper")
public class Demo02SbApplication {

	public static void main(String[] args) {
		SpringApplication.run(Demo02SbApplication.class, args);
	}

}
