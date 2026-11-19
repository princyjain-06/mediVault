package com.medivault.service._parked;

import com.medivault.exception.ResourceNotFoundException;
import com.medivault.model.Appointment;
import com.medivault.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;

    public List<Appointment> getByPatient(String patientId) {
        return appointmentRepository.findByPatientId(patientId);
    }

    public Appointment create(Appointment appointment) {
        appointment.setStatus("upcoming");
        return appointmentRepository.save(appointment);
    }

    public Appointment updateStatus(String id, String status) {
        Appointment apt = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + id));
        apt.setStatus(status);
        return appointmentRepository.save(apt);
    }

    public void cancel(String id) {
        Appointment apt = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + id));
        apt.setStatus("cancelled");
        appointmentRepository.save(apt);
    }
}
