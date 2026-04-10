package com.shoetrack.identity_service.controller;

import com.shoetrack.identity_service.model.Empleado;
import com.shoetrack.identity_service.repository.EmpleadoRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/login")
@CrossOrigin(origins = "*") 
public class AuthController {

    @Autowired
    private EmpleadoRepository empleadoRepository;

    private final String SECRET_KEY = "Firma_Secreta_Arro_2026_ShoeTrack_Enterprise_Security"; 

    @PostMapping
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credenciales) {
        String email = credenciales.get("email");
        String password = credenciales.get("password");

        Optional<Empleado> usuarioOpt = empleadoRepository.findByEmailAndPassword(email, password);

        if (usuarioOpt.isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("mensaje", "Credenciales inválidas");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

        Empleado usuario = usuarioOpt.get();
        Key key = Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
        
        String token = Jwts.builder()
                .claim("id_empleado", usuario.getIdEmpleado())
                .claim("rol", usuario.getRol())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 28800000)) // 8 horas
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();

        Map<String, Object> response = new HashMap<>();
        response.put("mensaje", "Autenticación exitosa");
        response.put("token", token);
        
        Map<String, String> userInfo = new HashMap<>();
        userInfo.put("nombre", usuario.getNombre());
        userInfo.put("rol", usuario.getRol());
        response.put("usuario", userInfo);

        return ResponseEntity.ok(response);
    }
}