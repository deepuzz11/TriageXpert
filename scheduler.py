class Scheduler:
    def __init__(self):
        self.queue = []

    def schedule(self, patient_id, category):
        priority = {"Emergency": 1, "Urgent": 2, "Routine": 3}
        self.queue.append((priority[category], patient_id))
        self.queue.sort()
        return self.queue
