from app.inference import RawDetection, intersection_over_union, non_max_suppression


def test_iou_and_class_aware_nms():
    first = RawDetection("Pothole", 0.95, (10, 10, 100, 100))
    duplicate = RawDetection("Pothole", 0.80, (12, 12, 98, 98))
    other_class = RawDetection("Waterlogging", 0.75, (12, 12, 98, 98))
    assert intersection_over_union(first.box, duplicate.box) > 0.8
    assert non_max_suppression([duplicate, other_class, first]) == [first, other_class]
