// Toggle the visibility of the schedule form
function toggleScheduleForm(applicationId) {
    const form = document.getElementById(`schedule-form-${applicationId}`);
    if (form.classList.contains("hidden")) {
        form.classList.remove("hidden");
    } else {
        form.classList.add("hidden");
    }
}
