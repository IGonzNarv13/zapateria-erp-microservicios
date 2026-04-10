package com.shoetrack.identity_service.repository;

import com.shoetrack.identity_service.model.Empleado;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface EmpleadoRepository extends JpaRepository<Empleado, Long> {
    Optional<Empleado> findByEmailAndPassword(String email, String password);
}