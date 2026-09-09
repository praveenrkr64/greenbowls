package com.cloudkitchen;

import java.util.TimeZone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class CloudKitchenApplication {
    public static void main(String[] args) {
        TimeZone.setDefault(TimeZone.getTimeZone("GMT+05:30"));
        SpringApplication.run(CloudKitchenApplication.class, args);
    }
}
