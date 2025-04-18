package com.www.zz.fileuploadbackend.controller;


import com.www.zz.fileuploadbackend.config.base.Result;
import com.www.zz.fileuploadbackend.model.entity.StorageConfig;
import com.www.zz.fileuploadbackend.service.IAuthService;
import com.www.zz.fileuploadbackend.service.IStorageConfigService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;

@RestController
@RequestMapping("/config")
public class ConfigController {

    @Resource
    private IStorageConfigService storageConfigService;
    @Resource
    private IAuthService authService;

    @GetMapping
    public Result<?> getConfig(String type) {
        return Result.success(storageConfigService.getStorageConfigByType(type));
    }

    @PatchMapping
    public Result<?> updateConfig(@Valid @RequestBody StorageConfig config) {
        storageConfigService.updateStorageConfig(config);
        return Result.success();
    }

    @PostMapping("/test")
    public Result<?> testConfig(@Valid @RequestBody StorageConfig config) {
        storageConfigService.testStorageConfig(config);
        return Result.success();
    }

    @PostMapping("/setPassword")
    public Result<?> setPassword(@RequestParam String password) {
        authService.setMainUserPassword(password);
        return Result.success();
    }

    @GetMapping("/getPassword")
    public Result<?> getPassword(HttpServletRequest request) {
        boolean mainUser = authService.isMainUser(request.getRemoteAddr());
        return Result.success(authService.getMainUserPassword() + (mainUser ? 1 : 0));
    }
}
