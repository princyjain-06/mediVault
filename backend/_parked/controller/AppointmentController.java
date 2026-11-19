package com.medivault.controller._parked;

import com.medivault.model.Appointment;
import com.medivault.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    /** GET /api/patients/{patientId}/appointments */
    @GetMapping("/patients/{patientId}/appointments")
    public ResponseEntity<List<Appointment>> getByPatient(@PathVariable String patientId) {
        return ResponseEntity.ok(appointmentService.getByPatient(patientId));
    }

    /** POST /api/appointments */
    @PostMapping("/appointments")
    public ResponseEntity<Appointment> create(@RequestBody Appointment appointment) {
        return ResponseEntity.ok(appointmentService.create(appointment));
    }

    /** PATCH /api/appointments/{id}/status */
    @PatchMapping("/appointments/{id}/status")
    public ResponseEntity<Appointment> updateStatus(@PathVariable String id,
                                                     @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(appointmentService.updateStatus(id, body.get("status")));
    }

    /** DELETE /api/appointments/{id} */
    @DeleteMapping("/appointments/{id}")
    public ResponseEntity<Void> cancel(@PathVariable String id) {
        appointmentService.cancel(id);
        return ResponseEntity.noContent().build();
    }
}
